import mongoose, { Schema, Document } from 'mongoose';

export interface ISubmission extends Document {
  fullName: string;
  phone: string;

  attribution?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;

    gclid?: string;
    fbclid?: string;

    landingPage?: {
      url?: string;
      path?: string;
    };

    referrer?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    fullName: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    attribution: {
      utmSource: String,
      utmMedium: String,
      utmCampaign: String,
      utmContent: String,
      utmTerm: String,

      gclid: String,
      fbclid: String,

      landingPage: {
        url: String,
        path: String,
      },

      referrer: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Submission ||
  mongoose.model<ISubmission>('Submission', SubmissionSchema);