package com.synstudios.preview;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "BenchmarkSave")
public class BenchmarkSavePlugin extends Plugin {

    private static final String DOWNLOAD_SUBDIR = "SynStudios";

    @PluginMethod
    public void saveJsonToDownloads(PluginCall call) {
        String fileName = call.getString("fileName");
        String content = call.getString("content");

        if (fileName == null || fileName.isBlank() || content == null) {
            call.reject("fileName and content are required");
            return;
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                saveWithMediaStore(call, fileName, content);
            } else {
                saveLegacy(call, fileName, content);
            }
        } catch (Exception e) {
            call.reject("Save failed: " + e.getMessage(), e);
        }
    }

    private void saveWithMediaStore(PluginCall call, String fileName, String content) throws Exception {
        ContentResolver resolver = getContext().getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
        values.put(MediaStore.MediaColumns.MIME_TYPE, "application/json");
        values.put(
            MediaStore.MediaColumns.RELATIVE_PATH,
            Environment.DIRECTORY_DOWNLOADS + "/" + DOWNLOAD_SUBDIR
        );

        Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
        if (uri == null) {
            call.reject("Failed to create file in Downloads");
            return;
        }

        try (OutputStream os = resolver.openOutputStream(uri)) {
            if (os == null) {
                call.reject("Failed to open Downloads output stream");
                return;
            }
            os.write(content.getBytes(StandardCharsets.UTF_8));
        }

        resolveSaved(call, fileName, uri.toString());
    }

    private void saveLegacy(PluginCall call, String fileName, String content) throws Exception {
        File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        File synDir = new File(downloadsDir, DOWNLOAD_SUBDIR);
        if (!synDir.exists() && !synDir.mkdirs()) {
            call.reject("Could not create SynStudios folder in Downloads");
            return;
        }

        File outFile = new File(synDir, fileName);
        try (FileOutputStream fos = new FileOutputStream(outFile)) {
            fos.write(content.getBytes(StandardCharsets.UTF_8));
        }

        resolveSaved(call, fileName, Uri.fromFile(outFile).toString());
    }

    private void resolveSaved(PluginCall call, String fileName, String uri) {
        JSObject ret = new JSObject();
        ret.put("path", "Download/" + DOWNLOAD_SUBDIR + "/" + fileName);
        ret.put("uri", uri);
        call.resolve(ret);
    }
}
