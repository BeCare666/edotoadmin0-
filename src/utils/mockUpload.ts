// mockUpload.ts (à créer dans un dossier utils ou services)

export async function uploadToS3(file: File): Promise<{
    file: File;
    thumbnail: string;
    original: string;
}> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const objectUrl = URL.createObjectURL(file);
    return {
        file,
        thumbnail: objectUrl,
        original: objectUrl,
    };
}

