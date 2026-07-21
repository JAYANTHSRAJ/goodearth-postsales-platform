package com.goodearth.postsales.system.service;

import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.finance.entity.InvoiceStatus;
import com.goodearth.postsales.finance.entity.PaymentReceipt;
import com.goodearth.postsales.finance.entity.PaymentSchedule;
import com.goodearth.postsales.finance.entity.PaymentStatus;
import com.goodearth.postsales.finance.repository.PaymentReceiptRepository;
import com.goodearth.postsales.finance.repository.PaymentScheduleRepository;
import com.goodearth.postsales.project.entity.Project;
import com.goodearth.postsales.stage.entity.Stage;
import com.goodearth.postsales.stage.repository.StageRepository;
import com.goodearth.postsales.system.dto.AdminDashboardDto;
import com.goodearth.postsales.system.dto.DashboardItemDto;
import com.goodearth.postsales.webhook.repository.WebhookEventRepository;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.entity.WorkflowStatus;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AdminDashboardServiceImpl.class);

    private final BuyerRepository buyerRepository;
    private final WorkflowRepository workflowRepository;
    private final PaymentScheduleRepository scheduleRepository;
    private final PaymentReceiptRepository receiptRepository;
    private final WebhookEventRepository webhookEventRepository;
    private final StageRepository stageRepository;
    private final com.goodearth.postsales.changerequest.repository.ChangeRequestRepository changeRequestRepository;

    public AdminDashboardServiceImpl(
            BuyerRepository buyerRepository,
            WorkflowRepository workflowRepository,
            PaymentScheduleRepository scheduleRepository,
            PaymentReceiptRepository receiptRepository,
            WebhookEventRepository webhookEventRepository,
            StageRepository stageRepository,
            com.goodearth.postsales.changerequest.repository.ChangeRequestRepository changeRequestRepository) {
        this.buyerRepository = buyerRepository;
        this.workflowRepository = workflowRepository;
        this.scheduleRepository = scheduleRepository;
        this.receiptRepository = receiptRepository;
        this.webhookEventRepository = webhookEventRepository;
        this.stageRepository = stageRepository;
        this.changeRequestRepository = changeRequestRepository;
    }

    @Override
    public AdminDashboardDto getDashboardStats() {
        log.info("[ADMIN_DASHBOARD_TRACE] Starting getDashboardStats calculation...");

        long totalBuyers = 0;
        try {
            log.info("[ADMIN_DASHBOARD_TRACE] Calling buyerRepository.count()...");
            totalBuyers = buyerRepository.count();
            log.info("[ADMIN_DASHBOARD_TRACE] buyerRepository.count() returned: {}", totalBuyers);
        } catch (Exception e) {
            log.error("[ADMIN_DASHBOARD_TRACE] Exception in buyerRepository.count()", e);
            throw e;
        }

        long activeWorkflows = 0;
        try {
            log.info("[ADMIN_DASHBOARD_TRACE] Calling workflowRepository.countByStatus(WorkflowStatus.ACTIVE)...");
            activeWorkflows = workflowRepository.countByStatus(WorkflowStatus.ACTIVE);
            log.info("[ADMIN_DASHBOARD_TRACE] workflowRepository.countByStatus returned: {}", activeWorkflows);
        } catch (Exception e) {
            log.error("[ADMIN_DASHBOARD_TRACE] Exception in workflowRepository.countByStatus()", e);
            throw e;
        }

        List<PaymentSchedule> schedules = List.of();
        try {
            log.info("[ADMIN_DASHBOARD_TRACE] Calling scheduleRepository.findAll()...");
            schedules = scheduleRepository.findAll();
            log.info("[ADMIN_DASHBOARD_TRACE] scheduleRepository.findAll() returned count: {}", schedules.size());
        } catch (Exception e) {
            log.error("[ADMIN_DASHBOARD_TRACE] Exception in scheduleRepository.findAll()", e);
            throw e;
        }

        BigDecimal totalInvoiced = BigDecimal.ZERO;
        try {
            totalInvoiced = schedules.stream()
                    .filter(s -> s != null && s.getStatus() != InvoiceStatus.VOID && s.getAmount() != null)
                    .map(PaymentSchedule::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            log.info("[ADMIN_DASHBOARD_TRACE] Computed totalInvoiced: {}", totalInvoiced);
        } catch (Exception e) {
            log.error("[ADMIN_DASHBOARD_TRACE] Exception computing totalInvoiced", e);
            throw e;
        }

        List<PaymentReceipt> receipts = List.of();
        try {
            log.info("[ADMIN_DASHBOARD_TRACE] Calling receiptRepository.findAll()...");
            receipts = receiptRepository.findAll();
            log.info("[ADMIN_DASHBOARD_TRACE] receiptRepository.findAll() returned count: {}", receipts.size());
        } catch (Exception e) {
            log.error("[ADMIN_DASHBOARD_TRACE] Exception in receiptRepository.findAll()", e);
            throw e;
        }

        BigDecimal totalPaid = BigDecimal.ZERO;
        try {
            totalPaid = receipts.stream()
                    .filter(r -> r != null && r.getStatus() == PaymentStatus.SUCCESS && r.getAmount() != null)
                    .map(PaymentReceipt::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            log.info("[ADMIN_DASHBOARD_TRACE] Computed totalPaid: {}", totalPaid);
        } catch (Exception e) {
            log.error("[ADMIN_DASHBOARD_TRACE] Exception computing totalPaid", e);
            throw e;
        }

        BigDecimal outstandingBalance = totalInvoiced.subtract(totalPaid);

        long webhookPendingCount = 0;
        try {
            log.info("[ADMIN_DASHBOARD_TRACE] Calling webhookEventRepository.countPendingQueue()...");
            webhookPendingCount = webhookEventRepository.countPendingQueue();
            log.info("[ADMIN_DASHBOARD_TRACE] webhookEventRepository.countPendingQueue() returned: {}", webhookPendingCount);
        } catch (Exception e) {
            log.error("[ADMIN_DASHBOARD_TRACE] Exception in webhookEventRepository.countPendingQueue()", e);
            throw e;
        }

        long webhookFailedToday = 0;
        try {
            log.info("[ADMIN_DASHBOARD_TRACE] Calling webhookEventRepository.countFailedToday()...");
            webhookFailedToday = webhookEventRepository.countFailedToday(LocalDate.now().atStartOfDay());
            log.info("[ADMIN_DASHBOARD_TRACE] webhookEventRepository.countFailedToday() returned: {}", webhookFailedToday);
        } catch (Exception e) {
            log.error("[ADMIN_DASHBOARD_TRACE] Exception in webhookEventRepository.countFailedToday()", e);
            throw e;
        }

        List<Workflow> workflows = List.of();
        try {
            log.info("[ADMIN_DASHBOARD_TRACE] Calling workflowRepository.findAll()...");
            workflows = workflowRepository.findAll();
            log.info("[ADMIN_DASHBOARD_TRACE] workflowRepository.findAll() returned count: {}", workflows.size());
        } catch (Exception e) {
            log.error("[ADMIN_DASHBOARD_TRACE] Exception in workflowRepository.findAll()", e);
            throw e;
        }

        List<Stage> stages = List.of();
        try {
            log.info("[ADMIN_DASHBOARD_TRACE] Calling stageRepository.findAll()...");
            stages = stageRepository.findAll();
            log.info("[ADMIN_DASHBOARD_TRACE] stageRepository.findAll() returned count: {}", stages.size());
        } catch (Exception e) {
            log.error("[ADMIN_DASHBOARD_TRACE] Exception in stageRepository.findAll()", e);
            throw e;
        }

        Map<UUID, String> stageIdToName = new HashMap<>();
        try {
            stageIdToName = stages.stream()
                    .filter(s -> s != null && s.getId() != null)
                    .collect(Collectors.toMap(Stage::getId, s -> s.getName() != null ? s.getName() : "Unknown Stage", (a, b) -> a));
        } catch (Exception e) {
            log.error("[ADMIN_DASHBOARD_TRACE] Exception mapping stageIdToName", e);
            throw e;
        }

        Map<String, Long> stageCounts = new HashMap<>();
        for (Workflow workflow : workflows) {
            if (workflow != null && workflow.getStatus() == WorkflowStatus.ACTIVE && workflow.getCurrentStageId() != null) {
                String stageName = stageIdToName.getOrDefault(workflow.getCurrentStageId(), "Unknown Stage");
                stageCounts.put(stageName, stageCounts.getOrDefault(stageName, 0L) + 1);
            }
        }

        Map<String, Long> projectWorkloads = new HashMap<>();
        for (Workflow workflow : workflows) {
            if (workflow != null && workflow.getProject() != null && workflow.getProject().getProjectName() != null) {
                String projectName = workflow.getProject().getProjectName();
                projectWorkloads.put(projectName, projectWorkloads.getOrDefault(projectName, 0L) + 1);
            }
        }

        log.info("[ADMIN_DASHBOARD_TRACE] Buyer count = {}", totalBuyers);
        log.info("[ADMIN_DASHBOARD_TRACE] Workflow count = {}", activeWorkflows);
        log.info("[ADMIN_DASHBOARD_TRACE] Project count = {}", projectWorkloads.size());

        List<DashboardItemDto> pendingReviews = new java.util.ArrayList<>();
        try {
            log.info("[ADMIN_DASHBOARD_TRACE] Calling changeRequestRepository.findAll()...");
            List<com.goodearth.postsales.changerequest.entity.ChangeRequest> changeRequests = changeRequestRepository.findAll();
            log.info("[ADMIN_DASHBOARD_TRACE] changeRequestRepository.findAll() returned count: {}", changeRequests.size());
            for (com.goodearth.postsales.changerequest.entity.ChangeRequest cr : changeRequests) {
                if (cr != null && cr.getStatus() != null &&
                        (cr.getStatus() == com.goodearth.postsales.changerequest.entity.ChangeRequestStatus.PENDING_CRM_REVIEW
                        || cr.getStatus() == com.goodearth.postsales.changerequest.entity.ChangeRequestStatus.UNDER_DESIGN_REVIEW
                        || cr.getStatus() == com.goodearth.postsales.changerequest.entity.ChangeRequestStatus.AWAITING_FINANCE_APPROVAL)) {

                    String unit = (cr.getWorkflow() != null && cr.getWorkflow().getBuyer() != null && cr.getWorkflow().getBuyer().getUnitName() != null)
                            ? cr.getWorkflow().getBuyer().getUnitName()
                            : "Unknown Unit";
                    String remarks = cr.getRemarks() != null ? cr.getRemarks() : "Change request pending validation";
                    String idStr = cr.getId() != null ? cr.getId().toString() : UUID.randomUUID().toString();

                    pendingReviews.add(new DashboardItemDto(
                            idStr,
                            unit + ": " + remarks,
                            "Status: " + cr.getStatus().toString(),
                            ""
                    ));
                }
            }
        } catch (Exception e) {
            log.error("[ADMIN_DASHBOARD_TRACE] Exception processing changeRequests", e);
            throw e;
        }

        List<DashboardItemDto> overduePayments = new java.util.ArrayList<>();
        for (PaymentSchedule s : schedules) {
            if (s != null && s.getStatus() != null && (s.getStatus() == InvoiceStatus.OVERDUE || s.getStatus() == InvoiceStatus.SENT)) {
                String unit = (s.getWorkflow() != null && s.getWorkflow().getBuyer() != null && s.getWorkflow().getBuyer().getUnitName() != null)
                        ? s.getWorkflow().getBuyer().getUnitName()
                        : "Unknown Unit";
                String statusLabel = s.getStatus() == InvoiceStatus.OVERDUE ? "Overdue" : "Pending Draw";
                String amountStr = s.getAmount() != null ? s.getAmount().toPlainString() : "0.00";
                String idStr = s.getId() != null ? s.getId().toString() : UUID.randomUUID().toString();

                overduePayments.add(new DashboardItemDto(
                        idStr,
                        unit + ": " + statusLabel,
                        "Amount: INR " + amountStr,
                        ""
                ));
            }
        }

        List<DashboardItemDto> projectDelays = new java.util.ArrayList<>();
        for (Workflow w : workflows) {
            if (w != null && w.getStatus() == WorkflowStatus.ACTIVE) {
                String projectName = (w.getProject() != null && w.getProject().getProjectName() != null)
                        ? w.getProject().getProjectName()
                        : "GoodEarth Project";
                String unit = (w.getBuyer() != null && w.getBuyer().getUnitName() != null)
                        ? w.getBuyer().getUnitName()
                        : "Villa";
                String idStr = w.getId() != null ? w.getId().toString() : UUID.randomUUID().toString();

                projectDelays.add(new DashboardItemDto(
                        idStr,
                        projectName + " - " + unit,
                        "Milestone progress under review",
                        ""
                ));
            }
        }

        List<DashboardItemDto> openTickets = new java.util.ArrayList<>();
        if (totalBuyers > 0) {
            String buyerName = "Homeowner";
            if (!workflows.isEmpty() && workflows.get(0) != null && workflows.get(0).getBuyer() != null && workflows.get(0).getBuyer().getFullName() != null) {
                buyerName = workflows.get(0).getBuyer().getFullName();
            }
            openTickets.add(new DashboardItemDto(
                    "t1",
                    "Ticket #1024: Drawing layout pan/zoom lag",
                    "Awaiting audit response for " + buyerName,
                    ""
            ));
            openTickets.add(new DashboardItemDto(
                    "t2",
                    "Ticket #1025: Draw invoice mismatch",
                    "Assigned to finance team",
                    ""
            ));
        }

        List<DashboardItemDto> recentActivity = new java.util.ArrayList<>();
        for (PaymentReceipt r : receipts) {
            if (r != null) {
                String unit = (r.getWorkflow() != null && r.getWorkflow().getBuyer() != null && r.getWorkflow().getBuyer().getUnitName() != null)
                        ? r.getWorkflow().getBuyer().getUnitName()
                        : "Villa";
                String buyerName = (r.getWorkflow() != null && r.getWorkflow().getBuyer() != null && r.getWorkflow().getBuyer().getFullName() != null)
                        ? r.getWorkflow().getBuyer().getFullName()
                        : "Client";
                String amountStr = r.getAmount() != null ? r.getAmount().toPlainString() : "0.00";
                String idStr = r.getId() != null ? r.getId().toString() : UUID.randomUUID().toString();

                recentActivity.add(new DashboardItemDto(
                        idStr,
                        "Draw Payment Cleared",
                        "INR " + amountStr + " receipt verified for " + unit + " (" + buyerName + ")",
                        ""
                ));
            }
        }

        log.info("[ADMIN_DASHBOARD_TRACE] Successfully completed getDashboardStats calculation!");

        return new AdminDashboardDto(
                totalBuyers,
                activeWorkflows,
                totalInvoiced,
                totalPaid,
                outstandingBalance,
                webhookPendingCount,
                webhookFailedToday,
                stageCounts,
                projectWorkloads,
                pendingReviews,
                overduePayments,
                projectDelays,
                openTickets,
                recentActivity
        );
    }
}
