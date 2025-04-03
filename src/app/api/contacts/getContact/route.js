import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export async function GET() {
    
  try {
    // Fetch all contacts from the database
    const contacts = await prisma.contact.findMany({
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
      },
    });

    // Return the contacts as a JSON response
    return new Response(JSON.stringify(contacts), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch contacts" }),
      { status: 500 }
    );
  }
}
