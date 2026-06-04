class WorkflowListResponse {
  final List<WorkflowModel> workflows;

  WorkflowListResponse({required this.workflows});

  factory WorkflowListResponse.fromJson(Map<String, dynamic> json) {
    var data = json['data'] ?? {};
    var workflowsJson = data['workflows'] as List<dynamic>? ?? [];
    return WorkflowListResponse(
      workflows: workflowsJson.map((w) => WorkflowModel.fromJson(w)).toList(),
    );
  }
}

class WorkflowModel {
  final String workflowId;
  final String workflowType;
  final String currentState;
  final String? assignedStaff;
  final int? appointmentId;
  final String? appointmentDate;
  final String? petName;
  final List<WorkflowTimelineEventModel> timeline;
  final String? createdAt;
  final String? updatedAt;

  WorkflowModel({
    required this.workflowId,
    required this.workflowType,
    required this.currentState,
    this.assignedStaff,
    this.appointmentId,
    this.appointmentDate,
    this.petName,
    required this.timeline,
    this.createdAt,
    this.updatedAt,
  });

  factory WorkflowModel.fromJson(Map<String, dynamic> json) {
    var timelineJson = json['timeline'] as List<dynamic>? ?? [];
    return WorkflowModel(
      workflowId: json['workflow_id'] as String? ?? '',
      workflowType: json['workflow_type'] as String? ?? 'unknown',
      currentState: json['current_state'] as String? ?? '',
      assignedStaff: json['assigned_staff'] as String?,
      appointmentId: json['appointment_id'] as int?,
      appointmentDate: json['appointment_date'] as String?,
      petName: json['pet_name'] as String?,
      timeline: timelineJson.map((t) => WorkflowTimelineEventModel.fromJson(t)).toList(),
      createdAt: json['created_at'] as String?,
      updatedAt: json['updated_at'] as String?,
    );
  }
}

class WorkflowTimelineEventModel {
  final int id;
  final String eventType;
  final String? previousState;
  final String? newState;
  final String? notes;
  final String? createdAt;

  WorkflowTimelineEventModel({
    required this.id,
    required this.eventType,
    this.previousState,
    this.newState,
    this.notes,
    this.createdAt,
  });

  factory WorkflowTimelineEventModel.fromJson(Map<String, dynamic> json) {
    return WorkflowTimelineEventModel(
      id: json['id'] as int? ?? 0,
      eventType: json['event_type'] as String? ?? '',
      previousState: json['previous_state'] as String?,
      newState: json['new_state'] as String?,
      notes: json['notes'] as String?,
      createdAt: json['created_at'] as String?,
    );
  }
}
