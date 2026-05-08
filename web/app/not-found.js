
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="container mx-auto px-4 py-16 text-center">
            <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
            <p className="text-muted-foreground mb-8">Could not find requested resource</p>
            <Link href="/" className="text-primary hover:underline">
                Return Home
            </Link>
        </div>
    );
}
