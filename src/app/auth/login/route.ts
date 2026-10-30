import { NextResponse, type NextRequest } from "next/server";
import { getAbsoluteUrl } from "@/lib/utils/url";

export async function GET(request: NextRequest) {
  return NextResponse.redirect(getAbsoluteUrl("/login", request));
}
