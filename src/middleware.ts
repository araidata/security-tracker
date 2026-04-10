export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/goals/:path*",
    "/rocks/:path*",
    "/assignments/:path*",
    "/updates/:path*",
    "/reviews/:path*",
    "/admin/:path*",
  ],
};
