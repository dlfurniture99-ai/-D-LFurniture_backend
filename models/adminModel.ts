import mongoose, { Schema } from 'mongoose';

const AdminSchema = new Schema({
    adminName: { type: String, required: true },
    adminEmail: { type: String, required: true },
    adminPassword: { type: String, required: true },
    adminSession: { type: String, required: true },
})

const adminModel = mongoose.model("Admin", AdminSchema);

export default adminModel;