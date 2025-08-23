import { supabase } from "../app";
import logger from "../util/winstonLogger";

type VLRBetsPayload = {
  matchId: string;
  team: string;
  odds: number;
  amount: number;
  transaction_hash: string;
  wallet_address: string;
};

export const vlrMakeBets = async (vlrBetsPayload: VLRBetsPayload) => {
  try {
    const { matchId, team, odds, amount, transaction_hash, wallet_address } =
      vlrBetsPayload;

    // Try to find existing match
    try {
      const { data: match, error: matchError } = await supabase
        .from("liveMatches")
        .select("*")
        .eq("matchID", matchId)
        .single();

      if (matchError) {
        throw new Error(`Failed to query match: ${matchError.message}`);
      }

      if (!match) {
        throw new Error("Match not found");
      }

      logger.info(`Match found | Match ID: ${matchId}`);
    } catch (matchFindError) {
      logger.error(
        `Match not found | Match ID: ${matchId} | Creating new match with Match ID: ${matchId}`
      );

      // Create new match if it doesn't exist
      try {
        const { data: newMatch, error: newMatchError } = await supabase
          .from("liveMatches")
          .insert([{ matchID: matchId }])
          .single();

        if (newMatchError) {
          throw new Error(`Failed to create match: ${newMatchError.message}`);
        }

        if (!newMatch) {
          throw new Error("No data returned when creating match");
        }

        logger.info(`New match created successfully | Match ID: ${matchId}`);
      } catch (createError) {
        logger.error(
          `Error creating match | Match ID: ${matchId} | Message: ${createError}`
        );
        throw new Error(`Error creating match: ${createError}`);
      }
    }

    // Insert the bet
    try {
      const { data, error } = await supabase.from("matchBets").insert([
        {
          matchID: matchId,
          team,
          odds,
          amount,
          transaction_hash,
          wallet_address,
        },
      ]);

      if (error) {
        throw new Error(`Failed to insert bet: ${error.message}`);
      }

      logger.info(
        `Bet placed successfully | Match ID: ${matchId} | Team: ${team} | Amount: ${amount}`
      );

      return {
        success: true,
        data,
      };
    } catch (betError) {
      logger.error(
        `Error making bet | Match ID: ${matchId} | Message: ${betError}`
      );
      throw new Error(`Error making bet: ${betError}`);
    }
  } catch (error) {
    // Top-level error handler
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(`VLR Make Bets failed | Error: ${errorMessage}`);

    // Re-throw the error so calling code can handle it appropriately
    throw new Error(`VLR betting operation failed: ${errorMessage}`);
  }
};
