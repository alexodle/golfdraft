import {mongoose} from './mongooseUtil';

const messageSchema = new mongoose.Schema({
  tourneyId: mongoose.Schema.Types.ObjectId,
  user: mongoose.Schema.Types.ObjectId,
  isBot: Boolean,
  message: String,
  date: Date
});
messageSchema.index({ tourneyId: 1 });

export const Message = mongoose.model('Message', messageSchema);
