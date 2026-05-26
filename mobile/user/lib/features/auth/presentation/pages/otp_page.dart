import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../../../core/theme/app_colors.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_event.dart';
import '../bloc/auth_state.dart';

class OtpPage extends StatelessWidget {
  final String phoneNumber;
  const OtpPage({super.key, this.phoneNumber = ''});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => AuthBloc()..add(SavePhoneNumber(phoneNumber)),
      child: OtpView(phoneNumber: phoneNumber),
    );
  }
}

class OtpView extends StatefulWidget {
  final String phoneNumber;
  const OtpView({super.key, required this.phoneNumber});

  @override
  State<OtpView> createState() => _OtpViewState();
}

class _OtpViewState extends State<OtpView> {
  final TextEditingController _otpController = TextEditingController();
  final FocusNode _focusNode = FocusNode();

  @override
  void dispose() {
    _otpController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state.status == AuthStatus.success) {
          context.read<AuthBloc>().add(const ResetAuthStatus());
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Login successful'),
              backgroundColor: Colors.green,
            ),
          );
          context.go('/home');
        } else if (state.status == AuthStatus.failure) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.errorMessage ?? 'OTP verification failed'),
              backgroundColor: Colors.red,
            ),
          );
        }
      },
      child: BlocBuilder<AuthBloc, AuthState>(
        builder: (context, state) {
          final isLoading = state.status == AuthStatus.loading;
          return Scaffold(
            backgroundColor: AppColors.backgroundLightPurple,
            appBar: AppBar(
              backgroundColor: Colors.transparent,
              elevation: 0,
              leading: IconButton(
                icon: const Icon(Icons.arrow_back, color: AppColors.black),
                onPressed: () => context.pop(),
              ),
              title: Text(
                'ENTER THE CODE SENT TO\n+91 ${widget.phoneNumber}',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: AppColors.black,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              centerTitle: true,
            ),
            body: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  const SizedBox(height: 40),
                  // Logo
                  Column(
                    children: [
                      SvgPicture.asset(
                        'assets/logo.svg',
                        width: 180,
                        placeholderBuilder: (context) => const CircularProgressIndicator(),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Bringing Pet Care to Your Fingertips',
                        style: TextStyle(
                          color: AppColors.black,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 80),
                  
                  const Text(
                    'RESEND CODE',
                    style: TextStyle(
                      color: AppColors.grey,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // OTP Input Container
                  GestureDetector(
                    onTap: () {
                      if (!isLoading) {
                        _focusNode.requestFocus();
                      }
                    },
                    child: Container(
                      height: 58,
                      margin: const EdgeInsets.symmetric(horizontal: 24),
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        color: AppColors.primaryPink,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          // Hidden TextField
                          Opacity(
                            opacity: 0,
                            child: TextField(
                              controller: _otpController,
                              focusNode: _focusNode,
                              keyboardType: TextInputType.number,
                              maxLength: 6,
                              enabled: !isLoading,
                              onChanged: (value) {
                                setState(() {});
                                if (value.length == 6 && !isLoading) {
                                  context.read<AuthBloc>().add(OtpSubmitted(value));
                                }
                              },
                              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                              decoration: const InputDecoration(counterText: ""),
                            ),
                          ),
                          // Visual Dots Overlay (Centered in Stack)
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: List.generate(6, (index) {
                              bool hasDigit = _otpController.text.length > index;
                              return Container(
                                margin: const EdgeInsets.symmetric(horizontal: 4),
                                width: 10,
                                height: 10,
                                decoration: BoxDecoration(
                                  color: hasDigit ? AppColors.white : AppColors.white.withOpacity(0.3),
                                  shape: BoxShape.circle,
                                ),
                              );
                            }),
                          ),
                          // Arrow Button / Loader (Aligned to Right)
                          Align(
                            alignment: Alignment.centerRight,
                            child: GestureDetector(
                              onTap: () {
                                if (isLoading) return;
                                if (_otpController.text.length == 6) {
                                  context.read<AuthBloc>().add(OtpSubmitted(_otpController.text));
                                } else {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Please enter 6 digit OTP')),
                                  );
                                }
                              },
                              child: Container(
                                width: 40,
                                height: 40,
                                decoration: const BoxDecoration(
                                  color: AppColors.white,
                                  shape: BoxShape.circle,
                                ),
                                child: isLoading
                                    ? const Padding(
                                        padding: EdgeInsets.all(10.0),
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryPink),
                                        ),
                                      )
                                    : const Icon(
                                        Icons.chevron_right,
                                        color: AppColors.primaryPink,
                                      ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 20),
                  Text(
                    _otpController.text.isEmpty ? 'Tap to enter 6 digit OTP' : 'Entering: ${_otpController.text}',
                    style: const TextStyle(color: AppColors.grey),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
