import '../constants/api_constants.dart';

class ImageHelper {
  /// Safely resolves a potential relative image path or partial URL into a fully-qualified absolute URL
  static String? getSafeImageUrl(String? url) {
    if (url == null || url.isEmpty) return null;

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Attempt to resolve relative paths
    final baseUrl = ApiConstants.baseUrl;
    final uri = Uri.tryParse(baseUrl);
    if (uri != null) {
      final scheme = uri.scheme;
      final host = uri.host;
      final port = uri.port;
      
      final portString = (port == 80 || port == 443 || port == 0) ? '' : ':$port';
      final rootUrl = '$scheme://$host$portString';

      if (url.startsWith('/')) {
        return '$rootUrl$url';
      } else {
        return '$rootUrl/$url';
      }
    }

    return url;
  }
}
