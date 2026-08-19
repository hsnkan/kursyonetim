import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import KursSalon from "@/models/KursSalon";
import User from "@/models/User";
import { requireRole } from "@/lib/auth";
import { formatSalonBranding, sanitizeSalonInput } from "@/lib/branding";

export async function GET(request, context) {
  try {
    const auth = requireRole(request, ["developer"]);
    if (auth.error) return auth.error;

    await dbConnect();
    const { params } = context;
    const resolvedParams = await params;
    const salon = await KursSalon.findById(resolvedParams.id);

    if (!salon) {
      return NextResponse.json(
        { success: false, error: "Salon kaydı bulunamadı." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: formatSalonBranding(salon),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function PATCH(request, context) {
  try {
    const auth = requireRole(request, ["developer"]);
    if (auth.error) return auth.error;

    await dbConnect();
    const { params } = context;
    const resolvedParams = await params;
    const body = await request.json();
    const veri = sanitizeSalonInput(body);

    if (veri.salonAdi === "" && body.salonAdi !== undefined) {
      return NextResponse.json(
        { success: false, error: "Salon/kurs adı boş olamaz." },
        { status: 400 },
      );
    }

    const updateData = Object.fromEntries(
      Object.entries(veri).filter(([, v]) => v !== "" || v === null),
    );

    const guncellenen = await KursSalon.findByIdAndUpdate(
      resolvedParams.id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!guncellenen) {
      return NextResponse.json(
        { success: false, error: "Salon kaydı bulunamadı." },
        { status: 404 },
      );
    }

    if (guncellenen.salonAdi) {
      await User.updateMany(
        { salonId: guncellenen._id },
        { $set: { salonAdi: guncellenen.salonAdi } },
      );
    }

    return NextResponse.json({
      success: true,
      data: formatSalonBranding(guncellenen),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(request, context) {
  try {
    const auth = requireRole(request, ["developer"]);
    if (auth.error) return auth.error;

    await dbConnect();
    const { params } = context;
    const resolvedParams = await params;

    const bagliKullanici = await User.countDocuments({
      salonId: resolvedParams.id,
    });

    if (bagliKullanici > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Bu salona bağlı kullanıcı var. Önce kullanıcıyı başka salona taşıyın veya silin.",
        },
        { status: 400 },
      );
    }

    await KursSalon.findByIdAndDelete(resolvedParams.id);
    return NextResponse.json({
      success: true,
      message: "Salon kaydı silindi.",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
