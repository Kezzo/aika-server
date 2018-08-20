import _ = require('underscore');
import httpStatus = require('http-status-codes');

import { AppLogger } from '../logging/app-logger';
import { SearchAccess } from '../common/search-access';
import { PodcastQuery } from '../queries/podcast-query';
import { PodcastController } from './podcast-controller';

export class SearchController {

  private static searchResultPageSize = 20;
  private static suggestionsSize = 10;

  public static async SearchForPodcasts(logger: AppLogger, searchTerm: string, nextToken: any) {
    searchTerm = this.SanitizeSearchTerm(searchTerm);
    if (!searchTerm) {
      return {
        msg: {},
        statusCode: httpStatus.OK
      };
    }

    nextToken = this.DecodeNextToken(nextToken);
    const searchResults = await SearchAccess.Search(logger, 'podcasts', this.GetQuery(searchTerm, nextToken));

    if (!searchResults || searchResults.length === 0) {
      return {
        msg: {},
        statusCode: httpStatus.OK
      };
    }

    const podcastIds = _.pluck(searchResults, '_id');
    const getPodcastsAsyncResult = await PodcastQuery.GetPodcasts(logger, podcastIds);

    const sortedPodcastResults = [];
    for (const searchResult of searchResults) {
      const podcastData = _.find(getPodcastsAsyncResult, (podcast: any) => {
        return podcast && podcast.PID === searchResult._id;
      });

      if (podcastData) {
        sortedPodcastResults.push();
      }
    }

    const podcastEntries = PodcastController.GetPodcastResponseMessage(sortedPodcastResults, null);

    let nextNextToken = null;

    if (searchResults.length >= this.searchResultPageSize) {
      nextNextToken = this.GenerateNextToken(searchTerm, nextToken);
    }

    return {
      msg: {
        result: podcastEntries,
        nextToken: nextNextToken
      },
      statusCode: httpStatus.OK
    };
  }

  public static async SearchForEpisodes(logger: AppLogger, searchTerm: string, nextToken: any) {
    searchTerm = this.SanitizeSearchTerm(searchTerm);
    if (!searchTerm) {
      return {
        msg: {},
        statusCode: httpStatus.OK
      };
    }

    nextToken = this.DecodeNextToken(nextToken);
    const searchResults = await SearchAccess.Search(logger, 'episodes', this.GetQuery(searchTerm, nextToken));

    if (!searchResults || searchResults.length === 0) {
      return {
        msg: {},
        statusCode: httpStatus.OK
      };
    }
    const episodeIds = _.pluck(searchResults, '_id');

    const episodeIdsToGet = new Array<{podcastId: string, index: number}>();

    for (const episodeId of episodeIds) {
      const splitEpisodeIdParts = episodeId.split('+');
      episodeIdsToGet.push({
        podcastId: splitEpisodeIdParts[0],
        index: parseInt(splitEpisodeIdParts[1], 10)
      });
    }

    const getEpisodesAsyncResult = await PodcastQuery.GetEpisodes(logger, episodeIdsToGet);

    const sortedEpisodeResults = [];
    for (const searchResult of searchResults) {
      const episodeData = _.find(getEpisodesAsyncResult, (episode: any) => {
        if (!episode) {
          return false;
        }

        const compositeEpisodeKey = episode.PID + '+' + episode.INDEX;
        return compositeEpisodeKey === searchResult._id;
      });

      if (episodeData) {
        sortedEpisodeResults.push(episodeData);
      }
    }

    const podcastEntries = PodcastController.GetEpisodeResponseMessage(sortedEpisodeResults);

    let nextNextToken = null;

    if (searchResults.length >= this.searchResultPageSize) {
      nextNextToken = this.GenerateNextToken(searchTerm, nextToken);
    }

    return {
      msg: {
        result: podcastEntries,
        nextToken: nextNextToken
      },
      statusCode: httpStatus.OK
    };
  }

  public static async SearchForSuggestions(logger: AppLogger, searchTerm: string) {
    searchTerm = this.SanitizeSearchTerm(searchTerm);
    if (!searchTerm) {
      return {
        msg: {},
        statusCode: httpStatus.OK
      };
    }

    const searchResults = await SearchAccess.Search(logger, 'podcasts', this.GetSuggestionsQuery(searchTerm));

    if (!searchResults || searchResults.length === 0) {
      return {
        msg: {},
        statusCode: httpStatus.OK
      };
    }

    const podcastNames = [];

    for (const searchResult of searchResults) {
      podcastNames.push(searchResult._source.NAME);
    }

    return {
      msg: {
        result: podcastNames
      },
      statusCode: httpStatus.OK
    };
  }

  private static SanitizeSearchTerm(searchTerm: string) {
    if (!searchTerm || searchTerm.length === 0) {
      return null;
    }

    searchTerm = searchTerm.toLowerCase();
    searchTerm = searchTerm.slice(0, 20);

    const escapeSpecialCharactersRegExp = new RegExp(
      /(\+|\-|\=|\&|\||\!|\(|\)|\{|\}|\[|\]|\^|\'|\"|\~|\*|\<|\>|\?|\:|\;|\\|\/)/, 'g');

    searchTerm = searchTerm.replace(escapeSpecialCharactersRegExp, '');

    if (!searchTerm || searchTerm.length === 0) {
      return null;
    }

    return searchTerm;
  }

  private static DecodeNextToken(nextTokenString: string) {
    if (!nextTokenString) {
      return null;
    }

    const buffer = new Buffer(nextTokenString, 'base64');
    return JSON.parse(buffer.toString('utf8'));
  }

  private static GenerateNextToken(searchTerm: string, lastNextToken: any) {
    const nextToken = {
      term: searchTerm,
      from: lastNextToken ? (lastNextToken.from + this.searchResultPageSize) : this.searchResultPageSize
    };

    return Buffer.from(JSON.stringify(nextToken)).toString('base64');
  }

  private static GetQuery(searchTerm: string, nextToken: any) {
    let from = 0;

    if (nextToken && nextToken.term && nextToken.term === searchTerm) {
      from = nextToken.from;
    }

    return {
      from,
      size: this.searchResultPageSize,
      query: {
        bool: {
          must: [
            {
              match: {
                NAME: {
                  query: searchTerm,
                  minimum_should_match: '75%'
                }
              }
            }
          ],
          should: [
            {
              term: { NAME_UA: searchTerm }
            },
            {
              fuzzy: { NAME_UA: searchTerm }
            },
            {
              match_phrase: { NAME_UA: searchTerm }
            }
          ]
        }
      }
    };
  }

  private static GetSuggestionsQuery(searchTerm: string) {
    return {
      size: this.suggestionsSize,
      query: {
        match_phrase_prefix: {
          NAME_UA: searchTerm
        }
      }
    };
  }
}
