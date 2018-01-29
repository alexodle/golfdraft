import {mongoose} from './mongooseUtil';
import * as passportLocalMongoose from 'passport-local-mongoose';

const Schema = mongoose.Schema;

const User = new Schema({
  name: { type: String, required: true, unique: true }
});

User.plugin(passportLocalMongoose, {
  limitAttempts: true,
  maxAttempts: 10
});

export default mongoose.model('User', User);
