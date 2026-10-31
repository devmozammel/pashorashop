export const TT_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || "DBJ2U7JC77U0QLCJRMN0";

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
