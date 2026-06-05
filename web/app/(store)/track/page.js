import TrackClient from "./TrackClient";

export const metadata = {
    title: "Track Your Order | Authentic Bazar",
    description: "Track your parcel in real-time. Enter your Order ID and phone/email to see live shipping status.",
    alternates: {
        canonical: "/track"
    }
};

export default function TrackOrderPage() {
    return <TrackClient />;
}
