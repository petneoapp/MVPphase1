import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiConstants {
  static String get baseUrl => dotenv.env['API_BASE_URL'] ?? 'https://casie-unregrettable-distinguishably.ngrok-free.dev/api/v1';

  // Auth endpoints
  static const String sendOtp = '/user/login/sendOtp'; // completed
  static const String verifyOtp = '/user/login/verifyOtp'; // completed
  static const String sendEmailOtp = '/sendEmailOtp';
  static const String verifyEmailOtp = '/verifyEmailOtp';
  static const String sendMobileOtp = '/user/sendMobileOtp';
  static const String verifyMobileOtp = '/user/verifyMobileOtp';
  static const String authLoginSendOtp = '/auth/login/sendOtp';
  static const String registerUser = '/user/registerUser'; // completed

  // User endpoints
  static const String home = '/user/home'; // completed
  static const String profile = '/user/profile'; // completed
  static const String updateProfile = '/user/updateProfile'; // completed
  static const String species = '/user/species'; // completed
  static const String nearbyVets = '/user/nearby-vets'; // completed
  static const String notifications = '/user/notifications';
  static String notificationRead(String id) => '/notifications/$id/read';

  // Pet endpoints
  static const String addPet = '/pets/addPet'; // completed
  static const String myPets = '/pets/myPets'; // completed
  static const String addPrescription = '/pets/addPrescription';
  static const String addVaccination = '/pets/addVaccination';
  static String petById(String petId) => '/pets/user/$petId'; // completed
  static String updatePet(String petId) => '/pets/updatePet/$petId';
  static String deleteVaccination(String id) => '/pets/user/deleteVaccination/$id';
  static String updateVaccination(String id) => '/pets/user/updateVaccination/$id';

  // Appointment endpoints
  static const String myAppointments = '/user/appointment/myAppointments'; // completed
  static const String addAppointment = '/user/appointment/add'; // completed
  static String appointmentById(String id) => '/user/appointment/$id'; // completed
  static String appointmentStatus(String id) => '/user/appointment/$id/status'; // completed

  // Availability endpoints
  static String availabilitySlots(String id) => '/availability/$id/slots'; // completed
  static String availabilityRescheduleSlots(String id) => '/availability/$id/rescheduleSlots';
  static String rescheduleAppointment(String id) => '/availability/user/reschedule/$id';

  // Address endpoints
  static const String myAddresses = '/user/address/myAddresses'; // completed
  static const String addAddress = '/user/address/add'; // completed
  static const String addressBase = '/user/address'; // completed
  static String addressById(String id) => '/user/address/$id'; // completed (used via addressBase concatenation)
  static String addressMakeDefault(String id) => '/user/address/$id/make-default';

  // Helper to construct full URL
  static Uri getUri(String endpoint, {Map<String, String>? queryParameters}) {
    final cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/$endpoint';
    return Uri.parse('$baseUrl$cleanEndpoint').replace(queryParameters: queryParameters);
  }
}
