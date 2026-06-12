import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/api_constants.dart';
import '../constants/app_strings.dart';
import '../constants/shared_pref_constants.dart';
import '../widgets/connectivity_handler.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, [this.statusCode]);

  @override
  String toString() => message;
}

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  
  factory ApiClient({http.Client? client}) {
    if (client != null) {
      _instance._client = client;
    }
    return _instance;
  }

  ApiClient._internal();

  http.Client _client = http.Client();
  String? _token;

  void updateToken(String? token) {
    _token = token;
  }

  Future<void> _loadCachedToken() async {
    if (_token == null) {
      try {
        final prefs = await SharedPreferences.getInstance();
        _token = prefs.getString(SharedPrefConstants.userToken);
      } catch (_) {}
    }
  }

  Future<Map<String, dynamic>> postMultipart(
    String endpoint, {
    Map<String, String>? queryParameters,
    Map<String, String>? fields,
    Map<String, String>? headers,
    String? filePath,
    String? fileKey,
  }) async {
    try {
      await _loadCachedToken();
      final uri = ApiConstants.getUri(endpoint, queryParameters: queryParameters);
      
      final request = http.MultipartRequest('POST', uri);
      
      if (_token != null) {
        request.headers['Authorization'] = _token!;
      }
      request.headers['accept'] = 'application/json';
      request.headers['ngrok-skip-browser-warning'] = '69420';
      if (headers != null) {
        request.headers.addAll(headers);
      }
      
      if (fields != null) {
        request.fields.addAll(fields);
      }

      if (filePath != null && fileKey != null) {
        final file = await http.MultipartFile.fromPath(fileKey, filePath);
        request.files.add(file);
      }

      print('--> [API REQUEST - MULTIPART POST] URL: $uri');
      print('--> [API HEADERS] ${request.headers}');
      print('--> [API FIELDS] ${request.fields}');
      if (filePath != null) {
        print('--> [API FILE] Key: $fileKey Path: $filePath');
      }

      final streamedResponse = await _client.send(request);
      final response = await http.Response.fromStream(streamedResponse);

      print('<-- [API RESPONSE - MULTIPART POST] STATUS: ${response.statusCode} URL: $uri');
      print('<-- [API RESPONSE BODY] ${response.body}');

      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      print('<-- [API EXCEPTION - MULTIPART POST] ERROR: $e');
      ConnectivityHandler.connectivityKey.currentState?.reportConnectionLoss();
      throw ApiException(AppStrings.connectionFailed);
    }
  }

  Future<Map<String, dynamic>> putMultipart(
    String endpoint, {
    Map<String, String>? queryParameters,
    Map<String, String>? fields,
    Map<String, String>? headers,
    String? filePath,
    String? fileKey,
  }) async {
    try {
      await _loadCachedToken();
      final uri = ApiConstants.getUri(endpoint, queryParameters: queryParameters);
      
      final request = http.MultipartRequest('PUT', uri);
      
      if (_token != null) {
        request.headers['Authorization'] = _token!;
      }
      request.headers['accept'] = 'application/json';
      request.headers['ngrok-skip-browser-warning'] = '69420';
      if (headers != null) {
        request.headers.addAll(headers);
      }
      
      if (fields != null) {
        request.fields.addAll(fields);
      }

      if (filePath != null && fileKey != null) {
        final file = await http.MultipartFile.fromPath(fileKey, filePath);
        request.files.add(file);
      }

      print('--> [API REQUEST - MULTIPART PUT] URL: $uri');
      print('--> [API HEADERS] ${request.headers}');
      print('--> [API FIELDS] ${request.fields}');
      if (filePath != null) {
        print('--> [API FILE] Key: $fileKey Path: $filePath');
      }

      final streamedResponse = await _client.send(request);
      final response = await http.Response.fromStream(streamedResponse);

      print('<-- [API RESPONSE - MULTIPART PUT] STATUS: ${response.statusCode} URL: $uri');
      print('<-- [API RESPONSE BODY] ${response.body}');

      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      print('<-- [API EXCEPTION - MULTIPART PUT] ERROR: $e');
      ConnectivityHandler.connectivityKey.currentState?.reportConnectionLoss();
      throw ApiException(AppStrings.connectionFailed);
    }
  }

  Future<Map<String, dynamic>> post(
    String endpoint, {
    Map<String, String>? queryParameters,
    Map<String, String>? headers,
    Object? body,
  }) async {
    try {
      await _loadCachedToken();
      final uri = ApiConstants.getUri(endpoint, queryParameters: queryParameters);
      final defaultHeaders = {
        'accept': 'application/json',
        'ngrok-skip-browser-warning': '69420',
        'content-type': 'application/json',
        if (_token != null) 'Authorization': _token!,
        ...?headers,
      };

      print('--> [API REQUEST - POST] URL: $uri');
      print('--> [API HEADERS] $defaultHeaders');
      if (body != null) {
        print('--> [API BODY] ${json.encode(body)}');
      }

      final response = await _client.post(
        uri,
        headers: defaultHeaders,
        body: body != null ? json.encode(body) : null,
      );

      print('<-- [API RESPONSE - POST] STATUS: ${response.statusCode} URL: $uri');
      print('<-- [API RESPONSE BODY] ${response.body}');

      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      print('<-- [API EXCEPTION - POST] ERROR: $e');
      ConnectivityHandler.connectivityKey.currentState?.reportConnectionLoss();
      throw ApiException(AppStrings.connectionFailed);
    }
  }

  Future<Map<String, dynamic>> get(
    String endpoint, {
    Map<String, String>? queryParameters,
    Map<String, String>? headers,
  }) async {
    try {
      await _loadCachedToken();
      final uri = ApiConstants.getUri(endpoint, queryParameters: queryParameters);
      final defaultHeaders = {
        'accept': 'application/json',
        'ngrok-skip-browser-warning': '69420',
        if (_token != null) 'Authorization': _token!,
        ...?headers,
      };

      print('--> [API REQUEST - GET] URL: $uri');
      print('--> [API HEADERS] $defaultHeaders');

      final response = await _client.get(
        uri,
        headers: defaultHeaders,
      );

      print('<-- [API RESPONSE - GET] STATUS: ${response.statusCode} URL: $uri');
      print('<-- [API RESPONSE BODY] ${response.body}');

      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      print('<-- [API EXCEPTION - GET] ERROR: $e');
      ConnectivityHandler.connectivityKey.currentState?.reportConnectionLoss();
      throw ApiException(AppStrings.connectionFailed);
    }
  }

  Future<Map<String, dynamic>> put(
    String endpoint, {
    Map<String, String>? queryParameters,
    Map<String, String>? headers,
    Object? body,
  }) async {
    try {
      await _loadCachedToken();
      final uri = ApiConstants.getUri(endpoint, queryParameters: queryParameters);
      final defaultHeaders = {
        'accept': 'application/json',
        'ngrok-skip-browser-warning': '69420',
        'content-type': 'application/json',
        if (_token != null) 'Authorization': _token!,
        ...?headers,
      };

      print('--> [API REQUEST - PUT] URL: $uri');
      print('--> [API HEADERS] $defaultHeaders');
      if (body != null) {
        print('--> [API BODY] ${json.encode(body)}');
      }

      final response = await _client.put(
        uri,
        headers: defaultHeaders,
        body: body != null ? json.encode(body) : null,
      );

      print('<-- [API RESPONSE - PUT] STATUS: ${response.statusCode} URL: $uri');
      print('<-- [API RESPONSE BODY] ${response.body}');

      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      print('<-- [API EXCEPTION - PUT] ERROR: $e');
      ConnectivityHandler.connectivityKey.currentState?.reportConnectionLoss();
      throw ApiException(AppStrings.connectionFailed);
    }
  }

  Future<Map<String, dynamic>> patch(
    String endpoint, {
    Map<String, String>? queryParameters,
    Map<String, String>? headers,
    Object? body,
  }) async {
    try {
      await _loadCachedToken();
      final uri = ApiConstants.getUri(endpoint, queryParameters: queryParameters);
      final defaultHeaders = {
        'accept': 'application/json',
        'ngrok-skip-browser-warning': '69420',
        'content-type': 'application/json',
        if (_token != null) 'Authorization': _token!,
        ...?headers,
      };

      print('--> [API REQUEST - PATCH] URL: $uri');
      print('--> [API HEADERS] $defaultHeaders');
      if (body != null) {
        print('--> [API BODY] ${json.encode(body)}');
      }

      final response = await _client.patch(
        uri,
        headers: defaultHeaders,
        body: body != null ? json.encode(body) : null,
      );

      print('<-- [API RESPONSE - PATCH] STATUS: ${response.statusCode} URL: $uri');
      print('<-- [API RESPONSE BODY] ${response.body}');

      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      print('<-- [API EXCEPTION - PATCH] ERROR: $e');
      ConnectivityHandler.connectivityKey.currentState?.reportConnectionLoss();
      throw ApiException(AppStrings.connectionFailed);
    }
  }

  Future<Map<String, dynamic>> delete(
    String endpoint, {
    Map<String, String>? queryParameters,
    Map<String, String>? headers,
  }) async {
    try {
      await _loadCachedToken();
      final uri = ApiConstants.getUri(endpoint, queryParameters: queryParameters);
      final defaultHeaders = {
        'accept': 'application/json',
        'ngrok-skip-browser-warning': '69420',
        if (_token != null) 'Authorization': _token!,
        ...?headers,
      };

      print('--> [API REQUEST - DELETE] URL: $uri');
      print('--> [API HEADERS] $defaultHeaders');

      final response = await _client.delete(
        uri,
        headers: defaultHeaders,
      );

      print('<-- [API RESPONSE - DELETE] STATUS: ${response.statusCode} URL: $uri');
      print('<-- [API RESPONSE BODY] ${response.body}');

      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      print('<-- [API EXCEPTION - DELETE] ERROR: $e');
      ConnectivityHandler.connectivityKey.currentState?.reportConnectionLoss();
      throw ApiException(AppStrings.connectionFailed);
    }
  }

  Map<String, dynamic> _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      try {
        final decoded = json.decode(response.body);
        if (decoded is Map<String, dynamic>) {
          return decoded;
        }
        return {'success': true, 'data': decoded};
      } catch (_) {
        print('<-- [API ERROR - PARSE] Failed to parse body: ${response.body}');
        throw ApiException(AppStrings.serverError, response.statusCode);
      }
    } else {
      String errorMessage = AppStrings.serverError;
      try {
        final decoded = json.decode(response.body);
        errorMessage = decoded['message'] ?? AppStrings.serverError;
      } catch (_) {}
      print('<-- [API ERROR - SERVER] Status: ${response.statusCode} Msg: $errorMessage');
      throw ApiException(errorMessage, response.statusCode);
    }
  }
}
