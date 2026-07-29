export interface Transaction {
    transition_id : number;
    application_id : number;
    reason : string;
    from_state_id:number;
    to_state_id: number;
    performed_by: number;
  }
  