import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/petneo_header.dart';

class AppointmentDetailsPage extends StatefulWidget {
  final String appointmentId;
  const AppointmentDetailsPage({super.key, required this.appointmentId});

  @override
  State<AppointmentDetailsPage> createState() => _AppointmentDetailsPageState();
}

class _AppointmentDetailsPageState extends State<AppointmentDetailsPage> {
  final ApiClient _apiClient = ApiClient();
  bool _isLoading = true;
  bool _isCancelling = false;
  String? _errorMessage;
  Map<String, dynamic>? _appointment;

  @override
  void initState() {
    super.initState();
    _loadDetails();
  }

  Future<void> _loadDetails() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final response = await _apiClient.get(ApiConstants.appointmentById(widget.appointmentId));
      if (!mounted) return;
      if (response['success'] == true) {
        final data = response['data'];
        setState(() {
          _appointment = data is Map<String, dynamic> ? data : null;
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = response['message']?.toString() ?? 'Failed to load appointment';
          _isLoading = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _cancelAppointment() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel appointment?'),
        content: const Text('This will cancel your appointment. You can\'t undo this.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Keep')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Cancel', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _isCancelling = true);
    try {
      final response = await _apiClient.patch(
        ApiConstants.appointmentStatus(widget.appointmentId),
        queryParameters: {'status': 'cancelled'},
      );
      if (!mounted) return;
      if (response['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Appointment cancelled'), backgroundColor: Colors.green),
        );
        context.go('/appointment-cancelled');
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(response['message']?.toString() ?? 'Failed to cancel'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _isCancelling = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLightPurple,
      appBar: const PetneoAppBar(title: 'Appointment Details'),
      body: SafeArea(bottom: false, child: _buildBody()),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primaryPink));
    }
    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, color: AppColors.grey, size: 48),
              const SizedBox(height: 12),
              Text(_errorMessage!, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.grey)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loadDetails,
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryPink),
                child: const Text('Retry', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ),
      );
    }

    final appt = _appointment ?? const <String, dynamic>{};
    final vet = appt['vet'] as Map<String, dynamic>?;
    final pet = appt['pet'] as Map<String, dynamic>?;
    final clinic = appt['clinic'] as Map<String, dynamic>?;
    final address = appt['address'] as Map<String, dynamic>?;
    final status = (appt['status'] as String? ?? '').toLowerCase();
    final isCancelled = status == 'cancelled';
    final isCompleted = status == 'completed';
    final canCancel = !isCancelled && !isCompleted;

    final vetName = vet?['name'] as String? ?? 'Vet';
    final vetProfile = vet?['profile'] as String?;
    final petName = pet?['name'] as String? ?? '';
    final visitType = appt['visit_type'] as String? ?? '';
    final visitPurpose = appt['visit_purpose'] as String? ?? '';
    final date = appt['date'] as String? ?? '';
    final time = appt['time'] as String? ?? '';
    final reason = appt['reason'] as String? ?? '';
    final clinicAddress = (clinic?['address'] ?? address?['address_line1'] ?? address?['line1'] ?? '') as String;

    final statusColor = isCancelled
        ? Colors.red
        : isCompleted
            ? Colors.green
            : AppColors.primaryPink;
    final statusIcon = isCancelled
        ? Icons.cancel
        : isCompleted
            ? Icons.check
            : Icons.event_available;
    final statusLabel = isCancelled
        ? 'Appointment Cancelled'
        : isCompleted
            ? 'Appointment Completed'
            : 'Appointment Booked';

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 120),
      child: Column(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(color: statusColor, shape: BoxShape.circle),
            child: Icon(statusIcon, color: Colors.white, size: 36),
          ),
          const SizedBox(height: 12),
          Text(statusLabel, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircleAvatar(
                radius: 14,
                backgroundColor: const Color(0xFFEDEFFB),
                backgroundImage: (vetProfile != null && vetProfile.isNotEmpty)
                    ? NetworkImage(vetProfile)
                    : const AssetImage('assets/profile.png') as ImageProvider,
              ),
              const SizedBox(width: 8),
              Text('Dr. $vetName', style: const TextStyle(fontWeight: FontWeight.w500)),
            ],
          ),
          const SizedBox(height: 20),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.grey.shade300),
            ),
            child: Column(
              children: [
                if (petName.isNotEmpty) _row(Icons.pets, 'Pet: $petName'),
                if (petName.isNotEmpty) const Divider(height: 1, indent: 16, endIndent: 16),
                if (visitType.isNotEmpty) _row(Icons.local_hospital_outlined, 'Visit Type: $visitType'),
                if (visitType.isNotEmpty) const Divider(height: 1, indent: 16, endIndent: 16),
                if (visitPurpose.isNotEmpty) _row(Icons.grid_view, visitPurpose),
                if (visitPurpose.isNotEmpty) const Divider(height: 1, indent: 16, endIndent: 16),
                _row(Icons.access_time, '$date${date.isNotEmpty && time.isNotEmpty ? ' • ' : ''}$time'),
                if (clinicAddress.isNotEmpty) const Divider(height: 1, indent: 16, endIndent: 16),
                if (clinicAddress.isNotEmpty) _row(Icons.location_on_outlined, clinicAddress),
                if (reason.isNotEmpty) const Divider(height: 1, indent: 16, endIndent: 16),
                if (reason.isNotEmpty) _row(Icons.notes_outlined, 'Reason: $reason'),
              ],
            ),
          ),
          const SizedBox(height: 32),
          if (canCancel)
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _isCancelling ? null : _cancelAppointment,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryPink,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: _isCancelling
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text(
                        'Cancel Appointment',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                      ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _row(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.black87),
          const SizedBox(width: 14),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 14))),
        ],
      ),
    );
  }
}
