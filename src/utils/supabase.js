import { createClient } from "@supabase/supabase-js";
import { supabaseKEY, supabaseURL } from "../config/env.js";

const supabase = createClient(supabaseURL, supabaseKEY);

export const deleteMedia = async (fileNameOrUrl) => {
    try {
        if (!fileNameOrUrl) {
            throw new Error("File name or URL is required to delete");
        }

        if (
            !fileNameOrUrl.includes(
                ".supabase.co/storage/v1/object/public/instaShare/"
            )
        ) {
            return {
                success: false,
                message: "Invalid file name",
            };
        }

        const filePath = fileNameOrUrl.split(
            "/storage/v1/object/public/instaShare/"
        )[1];

        const { data, error: deleteError } = await supabase.storage
            .from("instaShare")
            .remove([filePath]);

        if (deleteError) {
            throw deleteError;
        }

        if (data.length > 0) {
            return {
                success: true,
                message: "File deleted successfully",
            };
        } else {
            return {
                success: false,
                message: "No file was deleted",
            };
        }
    } catch (error) {
        console.error("Delete failed:", error);
        return false;
    }
};

export const verifyFileExists = async (fileUrl) => {
    try {
        if (!fileUrl) {
            throw new Error("File URL is required");
        }

        const basePath = ".supabase.co/storage/v1/object/public/instaShare/";
        if (!fileUrl.includes(basePath)) {
            return {
                success: false,
                message: "Invalid file URL",
            };
        }

        const response = await fetch(fileUrl, {
            method: "HEAD",
        });

        return true;
    } catch (err) {
        return false;
    }
};
