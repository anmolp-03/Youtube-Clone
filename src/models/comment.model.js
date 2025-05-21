import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
// Helpful when you have millions of comments and want to show limited results per page
// (e.g., 10 comments per page).
// This imports a pagination plugin specifically for aggregation queries.


const commSchema = new Schema({
    content: {
        type: String,
        required: true,
    },
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video",
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },

}, {timestamps: true})

commSchema.plugin(mongooseAggregatePaginate)

export const Comment = mongoose.model("Comment", commSchema)