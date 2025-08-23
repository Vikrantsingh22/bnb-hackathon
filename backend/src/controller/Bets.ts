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
  // Implement your betting logic here
  const { matchId, team, odds, amount, transaction_hash, wallet_address } =
    vlrBetsPayload;

  const { data: match, error: matchError } = await supabase
    .from("liveMatches")
    .select("*")
    .eq("matchID", matchId)
    .single();

  if (matchError || !match) {
    logger.error(
      `Match not found | Match ID: ${matchId} | Creating new match with payload: with Match ID: ${matchId}`
    );
    // creating match if does not exists

    const { data: newMatch, error: newMatchError } = await supabase
      .from("liveMatches")
      .insert([{ matchID: matchId }])
      .single();

    if (newMatchError || !newMatch) {
      logger.error(
        `Error creating match | Match ID: ${matchId} | Message: ${newMatchError}`
      );
      throw new Error("Error creating match");
    }
  }

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
    logger.error(`Error making bet | Message: ${error}`);
    throw new Error("Error making bet");
  }

  return {
    success: true,
    data,
  };
};
