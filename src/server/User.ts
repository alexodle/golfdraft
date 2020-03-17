import { model, mongoose } from './mongooseUtil';

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true, unique: true }
});

const UserModel = model('User', userSchema);
export default UserModel;
