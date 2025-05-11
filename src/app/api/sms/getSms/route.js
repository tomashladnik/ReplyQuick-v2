import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET()
{
    console.log("getSms is calling");
    try{
       const sms = await prisma.message.findMany();
       return NextResponse.json(sms);
    }
    catch(error){
        console.log(error);
        return NextResponse.json({error: "Failed to fetch sms"}, {status: 500});
    }
}