class EmailVerifyResponse {
  final bool success;
  final String message;
  final Map<String, dynamic> data;

  const EmailVerifyResponse({
    required this.success,
    required this.message,
    required this.data,
  });

  factory EmailVerifyResponse.fromJson(Map<String, dynamic> json) {
    return EmailVerifyResponse(
      success: json['success'] as bool? ?? false,
      message: json['message'] as String? ?? '',
      data: (json['data'] as Map<String, dynamic>?) ?? const {},
    );
  }

  Map<String, dynamic> toJson() => {
        'success': success,
        'message': message,
        'data': data,
      };
}
