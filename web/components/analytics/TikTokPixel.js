"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import * as ttpixel from "@/lib/ttpixel";

export default function TikTokPixel({ id }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (id) {
            ttpixel.pageview();
        }
    }, [pathname, searchParams, id]);

    if (!id) return null;

    return (
        <>
            <Script
                id="tiktok-pixel"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
            !function (w, d, t) {
              w.TiktokSdkObject = t;
              var ttq = w[t] = w[t] || [];
              ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "cleanCookie"];
              ttq.setAndDefer = function (t, e) {
                t[e] = function () {
                  t.push([e].concat(Array.prototype.slice.call(arguments, 0)))
                }
              };
              for (var e = 0; e < ttq.methods.length; e++) ttq.setAndDefer(ttq, ttq.methods[e]);
              ttq.instance = function (t) {
                for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++)ttq.setAndDefer(e, ttq.methods[n]);
                return e
              };
              ttq._i = {};
              ttq._f = function (t) {
                return function () {
                  var e = (new Date).getTime();
                  w[t].push([arguments[0], e, arguments[1]])
                }
              };
              ttq.load = function (e, t) {
                var n = "https://analytics.tiktok.com/i18n/pixel/events.js";
                w[t] = w[t] || [];
                w[t]._i = w[t]._i || {};
                w[t]._i[e] = [];
                w[t]._i[e]._u = n;
                w[t]._t = w[t]._t || {};
                w[t]._t[e] = +new Date;
                w[t]._o = w[t]._o || {};
                w[t]._o[e] = t;
                var o = d.createElement("script");
                o.type = "text/javascript";
                o.async = !0;
                o.src = n + "?sdkid=" + e + "&lib=" + t;
                var a = d.getElementsByTagName("script")[0];
                a.parentNode.insertBefore(o, a)
              };
              ttq.load('${id}');
              ttq.page();
            }(window, document, 'ttq');
          `,
                }}
            />
        </>
    );
}
