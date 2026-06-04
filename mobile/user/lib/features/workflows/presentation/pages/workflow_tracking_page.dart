import 'package:flutter/material.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../data/models/workflow_model.dart';

class WorkflowTrackingPage extends StatefulWidget {
  const WorkflowTrackingPage({super.key});

  @override
  State<WorkflowTrackingPage> createState() => _WorkflowTrackingPageState();
}

class _WorkflowTrackingPageState extends State<WorkflowTrackingPage> {
  final ApiClient _apiClient = ApiClient();
  bool _isLoading = true;
  String? _errorMessage;
  List<WorkflowModel> _allWorkflows = [];
  List<WorkflowModel> _filteredWorkflows = [];
  String _currentFilter = 'All';

  @override
  void initState() {
    super.initState();
    _fetchWorkflows();
  }

  Future<void> _fetchWorkflows() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _apiClient.get('/user/appointment/workflows');
      final listResponse = WorkflowListResponse.fromJson(response);
      
      setState(() {
        _allWorkflows = listResponse.workflows;
        // Sort by created_at descending (most recent first)
        _allWorkflows.sort((a, b) {
          final da = a.createdAt != null ? DateTime.tryParse(a.createdAt!) : null;
          final db = b.createdAt != null ? DateTime.tryParse(b.createdAt!) : null;
          if (da != null && db != null) return db.compareTo(da);
          return 0;
        });
        _applyFilter(_currentFilter);
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  void _applyFilter(String filter) {
    setState(() {
      _currentFilter = filter;
      if (filter == 'All') {
        _filteredWorkflows = _allWorkflows;
      } else {
        _filteredWorkflows = _allWorkflows.where((w) {
          final t = w.workflowType.toLowerCase();
          if (filter == 'Appointments' && t == 'general') return true;
          if (filter == 'Grooming' && t == 'grooming') return true;
          if (filter == 'Boarding' && t == 'boarding') return true;
          return false;
        }).toList();
      }
    });
  }

  String _formatDate(String? isoStr) {
    if (isoStr == null) return '';
    try {
      final d = DateTime.parse(isoStr).toLocal();
      final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      final hour = d.hour == 0 ? 12 : (d.hour > 12 ? d.hour - 12 : d.hour);
      final ampm = d.hour >= 12 ? 'PM' : 'AM';
      final min = d.minute.toString().padLeft(2, '0');
      return '${d.day.toString().padLeft(2, '0')} ${months[d.month - 1]}, $hour:$min $ampm';
    } catch (e) {
      return isoStr;
    }
  }

  String _formatLabel(String? text) {
    if (text == null || text.isEmpty) return 'Unknown';
    return text.split('_').map((word) => word.isNotEmpty ? word[0].toUpperCase() + word.substring(1).toLowerCase() : '').join(' ');
  }

  IconData _getServiceIcon(String type) {
    switch (type.toLowerCase()) {
      case 'grooming': return Icons.cut;
      case 'boarding': return Icons.night_shelter;
      case 'general': return Icons.medical_services;
      case 'surgery': return Icons.healing;
      default: return Icons.event;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('My Activity', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 1,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: Column(
        children: [
          _buildFilters(),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildFilters() {
    final filters = ['All', 'Appointments', 'Grooming', 'Boarding'];
    return Container(
      height: 60,
      color: Colors.white,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        itemCount: filters.length,
        itemBuilder: (context, index) {
          final f = filters[index];
          final isSelected = _currentFilter == f;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(f),
              selected: isSelected,
              onSelected: (selected) {
                if (selected) _applyFilter(f);
              },
              selectedColor: AppColors.primaryPink.withValues(alpha: 0.1),
              labelStyle: TextStyle(
                color: isSelected ? AppColors.primaryPink : Colors.black87,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(color: isSelected ? AppColors.primaryPink : Colors.grey[300]!),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primaryPink));
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            Text(_errorMessage!, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _fetchWorkflows,
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryPink),
              child: const Text('Retry'),
            )
          ],
        ),
      );
    }

    if (_filteredWorkflows.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.history, size: 80, color: Colors.grey[400]),
            const SizedBox(height: 16),
            const Text('No Activity Found', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87)),
            const SizedBox(height: 8),
            const Text('Book a service to see it tracked here.', style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchWorkflows,
      color: AppColors.primaryPink,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _filteredWorkflows.length,
        separatorBuilder: (context, index) => const SizedBox(height: 16),
        itemBuilder: (context, index) {
          return _buildWorkflowCard(_filteredWorkflows[index]);
        },
      ),
    );
  }

  Widget _buildWorkflowCard(WorkflowModel wf) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primaryPink.withValues(alpha: 0.05),
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(16), topRight: Radius.circular(16)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, border: Border.all(color: AppColors.primaryPink.withValues(alpha: 0.3))),
                  child: Icon(_getServiceIcon(wf.workflowType), color: AppColors.primaryPink, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${_formatLabel(wf.workflowType)} for ${wf.petName ?? "Pet"}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      if (wf.appointmentDate != null)
                        Text(wf.appointmentDate!, style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.blue.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.blue.withValues(alpha: 0.3)),
                  ),
                  child: Text(
                    _formatLabel(wf.currentState),
                    style: const TextStyle(color: Colors.blue, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                )
              ],
            ),
          ),
          
          // Timeline
          if (wf.timeline.isNotEmpty)
            Padding(
              padding: const EdgeInsets.all(20),
              child: _buildTimelineWidget(wf.timeline),
            )
          else
            const Padding(
              padding: EdgeInsets.all(20),
              child: Text('No tracking events available yet.', style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic)),
            ),
            
          // Footer
          if (wf.assignedStaff != null)
            Padding(
              padding: const EdgeInsets.only(left: 20, right: 20, bottom: 20),
              child: Row(
                children: [
                  const Icon(Icons.person, size: 16, color: Colors.grey),
                  const SizedBox(width: 8),
                  Text('Assigned to: ${wf.assignedStaff}', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTimelineWidget(List<WorkflowTimelineEventModel> events) {
    // Determine the unique states we care about based on event transitions
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: List.generate(events.length, (index) {
        final ev = events[index];
        final isLast = index == events.length - 1;
        
        // Display the new state the workflow transitioned to
        final displayState = ev.newState ?? ev.eventType;
        final label = _formatLabel(displayState);
        
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Column(
              children: [
                Container(
                  width: 16,
                  height: 16,
                  decoration: BoxDecoration(
                    color: isLast ? AppColors.primaryPink : Colors.green,
                    shape: BoxShape.circle,
                  ),
                ),
                if (!isLast)
                  Container(
                    width: 2,
                    height: 40,
                    color: Colors.green,
                  )
              ],
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontWeight: isLast ? FontWeight.bold : FontWeight.normal,
                      color: isLast ? Colors.black87 : Colors.grey[700],
                      fontSize: 14,
                    ),
                  ),
                  if (ev.createdAt != null) ...[
                    const SizedBox(height: 2),
                    Text(_formatDate(ev.createdAt), style: const TextStyle(fontSize: 12, color: Colors.grey)),
                  ],
                  if (ev.notes != null && ev.notes!.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(ev.notes!, style: TextStyle(fontSize: 12, color: Colors.grey[600], fontStyle: FontStyle.italic)),
                  ],
                  const SizedBox(height: 20), // spacer
                ],
              ),
            )
          ],
        );
      }),
    );
  }
}
