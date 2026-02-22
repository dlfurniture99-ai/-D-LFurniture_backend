import mongoose, { Schema, Document, Model } from 'mongoose';

// Booking Interface
export interface IBooking extends Document {
    userId: mongoose.Types.ObjectId;
    orderId?: string;
    items: {
        productId: mongoose.Types.ObjectId;
        productName: string;
        quantity: number;
        price: number;
        image?: string;
    }[];
    totalAmount: number;
    discountAmount?: number;
    finalAmount: number;
    bookingDate: Date;
    deliveryDate?: Date;
    deliveryAddress: {
        name: string;
        email: string;
        phone: string;
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    billingAddress?: {
        name: string;
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    paymentMethod: 'creditCard' | 'debitCard' | 'netBanking' | 'upi' | 'wallet' | 'cod';
    paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
    transactionId?: string;
    bookingStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    cancellationReason?: string;
    cancellationDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Booking Schema
const BookingSchema = new Schema<IBooking>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        orderId: {
            type: String,
            unique: true,
            sparse: true,
            index: true,
        },
        items: [
            {
                productId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Product',
                    required: [true, 'Product ID is required'],
                },
                productName: {
                    type: String,
                    required: [true, 'Product name is required'],
                },
                quantity: {
                    type: Number,
                    required: [true, 'Quantity is required'],
                    min: [1, 'Quantity must be at least 1'],
                },
                price: {
                    type: Number,
                    required: [true, 'Price is required'],
                    min: [0, 'Price cannot be negative'],
                },
                image: {
                    type: String,
                },
            },
        ],
        totalAmount: {
            type: Number,
            required: [true, 'Total amount is required'],
            min: [0, 'Total amount cannot be negative'],
        },
        discountAmount: {
            type: Number,
            default: 0,
            min: [0, 'Discount cannot be negative'],
        },
        finalAmount: {
            type: Number,
            required: [true, 'Final amount is required'],
            min: [0, 'Final amount cannot be negative'],
        },
        bookingDate: {
            type: Date,
            default: Date.now,
            index: true,
        },
        deliveryDate: {
            type: Date,
        },
        deliveryAddress: {
            name: {
                type: String,
                required: [true, 'Recipient name is required'],
            },
            email: {
                type: String,
                required: [true, 'Email is required'],
                lowercase: true,
                match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format'],
            },
            phone: {
                type: String,
                required: [true, 'Phone number is required'],
                match: [/^[0-9]{10}$/, 'Phone number must be 10 digits'],
            },
            street: {
                type: String,
                required: [true, 'Street address is required'],
            },
            city: {
                type: String,
                required: [true, 'City is required'],
            },
            state: {
                type: String,
                required: [true, 'State is required'],
            },
            postalCode: {
                type: String,
                required: [true, 'Postal code is required'],
                match: [/^[0-9]{6}$/, 'Postal code must be 6 digits'],
            },
            country: {
                type: String,
                default: 'India',
            },
        },
        billingAddress: {
            name: String,
            street: String,
            city: String,
            state: String,
            postalCode: String,
            country: String,
        },
        paymentMethod: {
            type: String,
            enum: {
                values: ['creditCard', 'debitCard', 'netBanking', 'upi', 'wallet', 'cod'],
                message: '{VALUE} is not a valid payment method',
            },
            required: [true, 'Payment method is required'],
        },
        paymentStatus: {
            type: String,
            enum: {
                values: ['pending', 'completed', 'failed', 'refunded'],
                message: '{VALUE} is not a valid payment status',
            },
            default: 'pending',
            index: true,
        },
        transactionId: {
            type: String,
            sparse: true,
        },
        bookingStatus: {
            type: String,
            enum: {
                values: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
                message: '{VALUE} is not a valid booking status',
            },
            default: 'pending',
            index: true,
        },
        cancellationReason: {
            type: String,
        },
        cancellationDate: {
            type: Date,
        },
        notes: {
            type: String,
            maxlength: [500, 'Notes cannot exceed 500 characters'],
        },
    },
    {
        timestamps: true,
        collection: 'bookings',
    }
);

// Indexes
BookingSchema.index({ userId: 1, bookingDate: -1 });
BookingSchema.index({ bookingStatus: 1, paymentStatus: 1 });
BookingSchema.index({ deliveryDate: 1 });

// Pre-save middleware
BookingSchema.pre<IBooking>('save', function (next) {
    if (!this.orderId) {
        this.orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    next();
});

// Instance methods
BookingSchema.methods.cancelBooking = function (reason: string) {
    if (this.bookingStatus === 'delivered') {
        throw new Error('Cannot cancel delivered booking');
    }
    this.bookingStatus = 'cancelled';
    this.cancellationReason = reason;
    this.cancellationDate = new Date();
    return this.save();
};

BookingSchema.methods.updatePaymentStatus = function (status: string, transactionId?: string) {
    if (!['pending', 'completed', 'failed', 'refunded'].includes(status)) {
        throw new Error('Invalid payment status');
    }
    this.paymentStatus = status;
    if (transactionId) {
        this.transactionId = transactionId;
    }
    return this.save();
};

BookingSchema.methods.getOrderSummary = function () {
    return {
        orderId: this.orderId,
        totalAmount: this.totalAmount,
        discountAmount: this.discountAmount,
        finalAmount: this.finalAmount,
        bookingStatus: this.bookingStatus,
        paymentStatus: this.paymentStatus,
        bookingDate: this.bookingDate,
        deliveryDate: this.deliveryDate,
    };
};

// Static methods
BookingSchema.statics.findByOrderId = function (orderId: string) {
    return this.findOne({ orderId });
};

BookingSchema.statics.findByUserId = function (userId: string) {
    return this.find({ userId }).sort({ bookingDate: -1 });
};

BookingSchema.statics.getPendingBookings = function () {
    return this.find({ bookingStatus: 'pending', paymentStatus: 'pending' });
};

BookingSchema.statics.getCompletedBookings = function () {
    return this.find({ bookingStatus: 'delivered', paymentStatus: 'completed' });
};

// Export
const Booking: Model<IBooking> = mongoose.model<IBooking>('Booking', BookingSchema);
export default Booking;