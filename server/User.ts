import {mongoose} from './mongooseUtil';
import * as passportLocalMongoose from 'passport-local-mongoose';

const Schema = mongoose.Schema;

const User = new Schema({
  name: { type: String, required: true, unique: true }
});

User.plugin(passportLocalMongoose, {
  limitAttempts: true,
  maxAttempts: 100,
  selectFields: ['_id', 'username', 'name'],
  findByUsername: (model, queryParameters) => {
    return model.findOne(queryParameters, ['_id', 'username', 'name']);
  }
});

export default mongoose.model('User', User);
