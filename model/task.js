import mongoose from "mongoose";

const taskObjectSchema = new mongoose.Schema({
  allDay: Boolean,
  title: String,
  start: Date,
});

const taskSchema = new mongoose.Schema({
  tasks: [taskObjectSchema],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }

});

const Task = mongoose.model("Task", taskSchema);

export default Task;
