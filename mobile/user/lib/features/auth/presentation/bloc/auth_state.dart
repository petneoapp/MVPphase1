import 'package:equatable/equatable.dart';

enum AuthStatus { initial, loading, success, failure }

class AuthState extends Equatable {
  final AuthStatus status;
  final String? phoneNumber;
  final String? otp;
  final String? firstName;
  final String? lastName;
  final String? email;
  final String? password;
  final String? petName;
  final String? petBreed;
  final String? petDob;
  final String? petGender;
  final String? petType;
  final String? petWeight;
  final String? errorMessage;

  const AuthState({
    this.status = AuthStatus.initial,
    this.phoneNumber,
    this.otp,
    this.firstName,
    this.lastName,
    this.email,
    this.password,
    this.petName,
    this.petBreed,
    this.petDob,
    this.petGender,
    this.petType,
    this.petWeight,
    this.errorMessage,
  });

  AuthState copyWith({
    AuthStatus? status,
    String? phoneNumber,
    String? otp,
    String? firstName,
    String? lastName,
    String? email,
    String? password,
    String? petName,
    String? petBreed,
    String? petDob,
    String? petGender,
    String? petType,
    String? petWeight,
    String? errorMessage,
  }) {
    return AuthState(
      status: status ?? this.status,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      otp: otp ?? this.otp,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      email: email ?? this.email,
      password: password ?? this.password,
      petName: petName ?? this.petName,
      petBreed: petBreed ?? this.petBreed,
      petDob: petDob ?? this.petDob,
      petGender: petGender ?? this.petGender,
      petType: petType ?? this.petType,
      petWeight: petWeight ?? this.petWeight,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  @override
  List<Object?> get props => [
        status,
        phoneNumber,
        otp,
        firstName,
        lastName,
        email,
        password,
        petName,
        petBreed,
        petDob,
        petGender,
        petType,
        petWeight,
        errorMessage,
      ];
}
