import axios from "axios";

const API_BASE_URL = "https://bnbrawl.vercel.app";
const API_KEY = "key1";
export interface Team {
  name: string;
  logo?: string;
  overallScore?: number;
  isWon?: boolean;
  players?: any[];
}

export interface BettingOdds {
  team1: {
    odds: number;
    direction: string;
  };
  team2: {
    odds: number;
    direction: string;
  };
}

export interface Match {
  matchUrl: string;
  matchID: string;
  time: string;
  team1: Team | string;
  team2: Team | string;
  status: string;
  eta: string | null;
  stats: string;
  vods: string;
  event: string;
  betting?: BettingOdds;
}

export interface MatchDay {
  date: string;
  matches: Match[];
}

class ApiService {
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
      },
    });
  }

  async getScheduledMatches(onlyLive: boolean = false): Promise<MatchDay[]> {
    try {
      const response = await this.axiosInstance.post("/vlr/scheduledMatches", {
        onlyLive,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching scheduled matches:", error);
      throw error;
    }
  }

  async getLiveMatches(): Promise<MatchDay[]> {
    return this.getScheduledMatches(true);
  }

  async getAllMatches(): Promise<MatchDay[]> {
    return this.getScheduledMatches(false);
  }
}

export const apiService = new ApiService();
