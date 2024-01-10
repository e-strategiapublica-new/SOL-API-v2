import { Bids } from "../schemas/bids.schema";

export interface NotificationInterface {

    title: string;
    description: string;
    from_user: string;
    deleted: boolean;
    bid_id: string
}