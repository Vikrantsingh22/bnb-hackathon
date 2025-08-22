import express from "express";
import logger from "../util/winstonLogger";
import {
  retrieveExtendedScheduledMatches,
  retrieveMatchStatistics,
  retrieveScheduledMatches,
  scrapeMatchResults,
  vlrLiveScore,
} from "../controller/VLR";
import {
  validateExctractMatcheStatistics,
  validateFetchScheduledMatches,
} from "../middleware/VLR";
const router = express.Router();
router.post(
  "/scheduledMatches",
  (req, res, next) => {
    logger.info(
      `Request received | URL: ${req.url} | Method: ${req.method} | IP: ${
        req.ip
      } | Headers: ${JSON.stringify(req.headers)}`
    );
    next();
  },
  validateFetchScheduledMatches,
  retrieveScheduledMatches
);

router.post(
  "/retrieveMatchStats",
  (req, res, next) => {
    logger.info(
      `Request received | URL: ${req.url} | Method: ${req.method} | IP: ${
        req.ip
      } | Headers: ${JSON.stringify(req.headers)}`
    );
    next();
  },
  validateExctractMatcheStatistics,

  async (req, res) => {
    if (req.body.isLive === true) {
      const liveResponse = await vlrLiveScore();
      return res.json(liveResponse);
    }
    const response = await retrieveMatchStatistics(req.body.matchUrl);
    res.json(response);
  }
);
router.post(
  "/retrieveExtendedScheduledMatches",
  (req, res, next) => {
    logger.info(
      `Request received | URL: ${req.url} | Method: ${req.method} | IP: ${
        req.ip
      } | Headers: ${JSON.stringify(req.headers)}`
    );
    next();
  },
  validateFetchScheduledMatches,
  retrieveExtendedScheduledMatches
);

router.post(
  "/scrapeMatchResults",
  (req, res, next) => {
    logger.info(
      `Request received | URL: ${req.url} | Method: ${req.method} | IP: ${
        req.ip
      } | Headers: ${JSON.stringify(req.headers)}`
    );
    next();
  },
  async (req, res) => {
    const response = await scrapeMatchResults();
    res.json(response);
  }
);

export default router;
