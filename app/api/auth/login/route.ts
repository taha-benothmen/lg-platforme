import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log("Attempting login for:", email);

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    console.log("👤 User found:", user ? "Yes" : "No");
    if (user) {
      console.log("User active:", user.isActive);
    }

    if (!user || !user.isActive) {
      console.log("User not found or inactive");
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if password is hashed or plain text
    let isValidPassword = false;
    if (user.password.startsWith('$2')) {
      // Password is hashed with bcrypt
      isValidPassword = await bcrypt.compare(password, user.password);
      console.log("Password valid (hashed):", isValidPassword);
    } else {
      // Password is plain text (NOT SECURE - fix this!)
      isValidPassword = password === user.password;
      console.warn("WARNING: Password not hashed for user:", user.email);
      console.log("Password valid (plain text):", isValidPassword);
    }

    if (!isValidPassword) {
      console.log("Invalid password");
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const routeMap = {
      ADMIN: "/admin/dashboard",
      ETABLISSEMENT: "/etablissement/produits",
      RESPONSABLE: "/responsable/produits",
    };

    const userSession = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      route: routeMap[user.role as keyof typeof routeMap],
    };

    const response = NextResponse.json({
      success: true,
      user: userSession,
    });

    response.cookies.set("lg_user_role", user.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    console.log("Login successful");
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}