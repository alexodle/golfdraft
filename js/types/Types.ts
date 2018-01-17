export interface User {
  name: string;
  _id: string;
}

export interface Location {
  state?: {
    from?: string;
  };
}
