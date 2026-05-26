import 'package:equatable/equatable.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class PhoneSubmitted extends AuthEvent {
  final String phoneNumber;
  const PhoneSubmitted(this.phoneNumber);
  @override
  List<Object?> get props => [phoneNumber];
}

class ResetAuthStatus extends AuthEvent {
  const ResetAuthStatus();
  @override
  List<Object?> get props => [];
}

class SavePhoneNumber extends AuthEvent {
  final String phoneNumber;
  const SavePhoneNumber(this.phoneNumber);
  @override
  List<Object?> get props => [phoneNumber];
}

class OtpSubmitted extends AuthEvent {
  final String otp;
  const OtpSubmitted(this.otp);
  @override
  List<Object?> get props => [otp];
}

class PersonalDetailsSubmitted extends AuthEvent {
  final String firstName;
  final String lastName;
  final String email;
  final String password;
  const PersonalDetailsSubmitted({
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.password,
  });
  @override
  List<Object?> get props => [firstName, lastName, email, password];
}

class PetDetailsSubmitted extends AuthEvent {
  final String petName;
  final String petBreed;
  final String petDob;
  final String petGender;
  final String petType;
  final String petWeight;
  const PetDetailsSubmitted({
    required this.petName,
    required this.petBreed,
    required this.petDob,
    required this.petGender,
    required this.petType,
    required this.petWeight,
  });
  @override
  List<Object?> get props => [petName, petBreed, petDob, petGender, petType, petWeight];
}

class RegisterSubmitted extends AuthEvent {
  final String phoneNumber;
  final String firstName;
  final String lastName;
  final String email;
  final String password;

  const RegisterSubmitted({
    required this.phoneNumber,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.password,
  });

  @override
  List<Object?> get props => [phoneNumber, firstName, lastName, email, password];
}
