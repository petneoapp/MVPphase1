import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/constants/app_strings.dart';
import '../../../../core/constants/shared_pref_constants.dart';
import '../../../../core/network/api_client.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final ApiClient _apiClient;

  AuthBloc({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient(),
        super(const AuthState()) {
    on<PhoneSubmitted>((event, emit) async {
      emit(state.copyWith(status: AuthStatus.loading, errorMessage: null));
      try {
        final response = await _apiClient.post(
          ApiConstants.sendOtp,
          queryParameters: {'mobile_number': event.phoneNumber},
        );

        if (response['success'] == true) {
          emit(state.copyWith(
            phoneNumber: event.phoneNumber,
            status: AuthStatus.success,
          ));
        } else {
          emit(state.copyWith(
            status: AuthStatus.failure,
            errorMessage: response['message'] ?? AppStrings.otpSendFailed,
          ));
        }
      } catch (e) {
        emit(state.copyWith(
          status: AuthStatus.failure,
          errorMessage: e.toString(),
        ));
      }
    });

    on<ResetAuthStatus>((event, emit) {
      emit(state.copyWith(status: AuthStatus.initial, errorMessage: null));
    });

    on<SavePhoneNumber>((event, emit) {
      emit(state.copyWith(phoneNumber: event.phoneNumber, status: AuthStatus.initial));
    });

    on<OtpSubmitted>((event, emit) async {
      emit(state.copyWith(status: AuthStatus.loading, errorMessage: null));
      try {
        final response = await _apiClient.post(
          ApiConstants.verifyOtp,
          queryParameters: {
            'mobile_number': state.phoneNumber ?? '',
            'otp': event.otp,
            'device_token': 'fhbhfb',
          },
        );

        if (response['success'] == true) {
          final data = response['data'] as Map<String, dynamic>?;
          final token = data?['access_token'] as String?;
          final userId = data?['user_id']?.toString();

          if (token != null && userId != null) {
            // Save in SharedPreferences
            final prefs = await SharedPreferences.getInstance();
            await prefs.setString(SharedPrefConstants.userToken, token);
            await prefs.setString(SharedPrefConstants.userId, userId);
            await prefs.setBool(SharedPrefConstants.isLoggedIn, true);

            // Update token globally in ApiClient
            _apiClient.updateToken(token);

            emit(state.copyWith(
              otp: event.otp,
              status: AuthStatus.success,
            ));
          } else {
            emit(state.copyWith(
              status: AuthStatus.failure,
              errorMessage: AppStrings.otpVerificationFailed,
            ));
          }
        } else {
          emit(state.copyWith(
            status: AuthStatus.failure,
            errorMessage: response['message'] ?? AppStrings.otpVerificationFailed,
          ));
        }
      } catch (e) {
        emit(state.copyWith(
          status: AuthStatus.failure,
          errorMessage: e.toString(),
        ));
      }
    });

    on<PersonalDetailsSubmitted>((event, emit) {
      emit(state.copyWith(
        firstName: event.firstName,
        lastName: event.lastName,
        email: event.email,
        password: event.password,
        status: AuthStatus.initial,
      ));
    });

    on<PetDetailsSubmitted>((event, emit) {
      emit(state.copyWith(
        petName: event.petName,
        petBreed: event.petBreed,
        petDob: event.petDob,
        petGender: event.petGender,
        petType: event.petType,
        petWeight: event.petWeight,
        status: AuthStatus.success,
      ));
    });

    on<RegisterSubmitted>((event, emit) async {
      emit(state.copyWith(status: AuthStatus.loading, errorMessage: null));
      try {
        final response = await _apiClient.postMultipart(
          ApiConstants.registerUser,
          fields: {
            'mobile_number': event.phoneNumber,
            'email': event.email,
            'password': event.password,
            'first_name': event.firstName,
            'last_name': event.lastName,
          },
        );

        if (response['success'] == true) {
          emit(state.copyWith(
            status: AuthStatus.success,
          ));
        } else {
          emit(state.copyWith(
            status: AuthStatus.failure,
            errorMessage: response['message'] ?? 'Registration failed',
          ));
        }
      } catch (e) {
        emit(state.copyWith(
          status: AuthStatus.failure,
          errorMessage: e.toString(),
        ));
      }
    });
  }
}
