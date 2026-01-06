export type FareSet = {
  price_1m: number;
  price_6m: number;
};

export type RouteCandidate = {
  route_str: string;
  distance: number;
  zone: string;
  price_1m: number;
  price_6m: number;
  full_path: string[];
  transfers: number;
  exceeds_five_station_rule: boolean;
};

export type StationData = {
  [lineName: string]: string[];
};

export type FareType = {
  id: string;
  label: string;
};
