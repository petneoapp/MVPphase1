import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_colors.dart';

class ConnectivityHandler extends StatefulWidget {
  final Widget child;

  const ConnectivityHandler({super.key, required this.child});

  static final GlobalKey<_ConnectivityHandlerState> connectivityKey =
      GlobalKey<_ConnectivityHandlerState>();

  @override
  State<ConnectivityHandler> createState() => _ConnectivityHandlerState();
}

class _ConnectivityHandlerState extends State<ConnectivityHandler> {
  bool _hasInternet = true;
  Timer? _timer;
  bool _isChecking = false;

  @override
  void initState() {
    super.initState();
    _startPeriodicCheck();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startPeriodicCheck() {
    _checkConnection();
    _timer = Timer.periodic(const Duration(seconds: 5), (_) {
      _checkConnection();
    });
  }

  Future<void> _checkConnection() async {
    if (_isChecking) return;
    _isChecking = true;
    try {
      final result = await InternetAddress.lookup('google.com')
          .timeout(const Duration(seconds: 4));
      final hasNet = result.isNotEmpty && result[0].rawAddress.isNotEmpty;
      if (hasNet != _hasInternet) {
        setState(() {
          _hasInternet = hasNet;
        });
      }
    } catch (_) {
      if (_hasInternet) {
        setState(() {
          _hasInternet = false;
        });
      }
    } finally {
      _isChecking = false;
    }
  }

  void reportConnectionLoss() {
    if (_hasInternet) {
      setState(() {
        _hasInternet = false;
      });
    }
  }

  void _closeApplication() {
    if (Platform.isAndroid) {
      SystemNavigator.pop();
    } else {
      exit(0);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_hasInternet) {
      return widget.child;
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF6F5FB),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primaryPink.withOpacity(0.1),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: AppColors.primaryPink.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.wifi_off_rounded,
                          size: 40,
                          color: AppColors.primaryPink,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Connection Lost',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: AppColors.black,
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Your device is currently offline. Please check your internet settings or try again.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.grey,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _checkConnection,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryPink,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                  child: const Text(
                    'Try Again',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: OutlinedButton(
                  onPressed: _closeApplication,
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.primaryPink, width: 2),
                    foregroundColor: AppColors.primaryPink,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Text(
                    'Close Application',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
