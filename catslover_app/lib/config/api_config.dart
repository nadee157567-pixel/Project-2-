class ApiConfig {
  // Use 10.0.2.2 for Android Emulator, localhost for iOS simulator/Web
  static const String baseUrl = 'http://10.0.2.2:3000/api';

  static String getImageUrl(String? url) {
    if (url == null || url.isEmpty) return '';
    try {
      final baseUri = Uri.parse(baseUrl);
      final hostPort = "${baseUri.scheme}://${baseUri.host}:${baseUri.port}";
      
      if (url.startsWith('http://10.0.2.2:3000')) {
        return url.replaceFirst('http://10.0.2.2:3000', hostPort);
      } else if (url.startsWith('http://localhost:3000')) {
        return url.replaceFirst('http://localhost:3000', hostPort);
      } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
        // Relative path
        String cleanUrl = url.startsWith('/') ? url.substring(1) : url;
        return "$hostPort/$cleanUrl";
      }
    } catch (e) {
      // Fallback
    }
    return url;
  }

  static String getShortAgeDesc(dynamic ageMonths) {
    if (ageMonths == null) return '';
    int age = int.tryParse(ageMonths.toString()) ?? 12;
    if (age < 2) return "ยังไม่หย่านม";
    if (age <= 6) return "ลูกแมว";
    if (age <= 12) return "แมววัยรุ่น";
    if (age <= 84) return "แมวโต";
    return "แมวสูงวัย";
  }
}
