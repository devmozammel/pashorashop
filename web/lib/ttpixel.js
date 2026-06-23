export const TT_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;

export const pageview = () => {
    if (typeof window.ttq !== 'undefined') {
        window.ttq.page();
    }
};

export const event = (name, options = {}) => {
    if (typeof window.ttq !== 'undefined') {
        window.ttq.track(name, options);
    }
};
