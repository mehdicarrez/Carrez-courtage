<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Services\AuditLogger;
use Illuminate\Http\Request;

class AuditController extends Controller
{
    public function __construct(private AuditLogger $audit)
    {
    }

    /**
     * RG-62/63 : journal consultable et filtrable multicritères, ajout seul
     * (aucune route de modification/suppression n'est exposée).
     */
    public function index(Request $request)
    {
        if (!$request->user()->estAdminCabinet()) {
            abort(403);
        }

        $query = AuditLog::query()->with('user');

        if ($request->filled('action')) {
            $query->where('action', 'like', '%'.$request->query('action').'%');
        }
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->query('user_id'));
        }
        if ($request->filled('objet_type')) {
            $query->where('objet_type', $request->query('objet_type'));
        }
        if ($request->filled('objet_id')) {
            $query->where('objet_id', $request->query('objet_id'));
        }
        if ($request->filled('organisation_id')) {
            $query->where('organisation_id', $request->query('organisation_id'));
        }
        if ($request->filled('depuis')) {
            $query->where('horodatage', '>=', $request->query('depuis'));
        }
        if ($request->filled('jusqu_au')) {
            $query->where('horodatage', '<=', \Illuminate\Support\Carbon::parse($request->query('jusqu_au'))->endOfDay());
        }
        if ($request->filled('q')) {
            $q = $request->query('q');
            $query->where(function ($sub) use ($q) {
                $sub->where('detail', 'like', '%'.$q.'%')
                    ->orWhere('action', 'like', '%'.$q.'%')
                    ->orWhere('objet_type', 'like', '%'.$q.'%');
            });
        }

        $logs = $query->orderByDesc('horodatage')->paginate(50);

        $this->audit->log('audit.consultation', 'journal_audit', null, null, null, 'filtres='.\json_encode(array_keys($request->query())));

        return response()->json([
            'data' => $logs->map(fn (AuditLog $l) => [
                'id' => $l->id,
                'horodatage' => $l->horodatage,
                'user' => $l->user?->name,
                'user_id' => $l->user_id,
                'ip' => $l->ip,
                'action' => $l->action,
                'objet_type' => $l->objet_type,
                'objet_id' => $l->objet_id,
                'detail' => $l->detail,
            ]),
            'meta' => [
                'total' => $logs->total(),
                'page' => $logs->currentPage(),
                'pages' => $logs->lastPage(),
            ],
        ]);
    }

    /**
     * RG-63 — Export CSV du journal d'audit selon les filtres.
     */
    public function export(Request $request)
    {
        if (!$request->user()->estAdminCabinet()) {
            abort(403);
        }

        $query = AuditLog::query()->with('user');

        if ($request->filled('action')) {
            $query->where('action', 'like', '%'.$request->query('action').'%');
        }
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->query('user_id'));
        }
        if ($request->filled('objet_type')) {
            $query->where('objet_type', $request->query('objet_type'));
        }
        if ($request->filled('objet_id')) {
            $query->where('objet_id', $request->query('objet_id'));
        }
        if ($request->filled('organisation_id')) {
            $query->where('organisation_id', $request->query('organisation_id'));
        }
        if ($request->filled('depuis')) {
            $query->where('horodatage', '>=', $request->query('depuis'));
        }
        if ($request->filled('jusqu_au')) {
            $query->where('horodatage', '<=', \Illuminate\Support\Carbon::parse($request->query('jusqu_au'))->endOfDay());
        }
        if ($request->filled('q')) {
            $q = $request->query('q');
            $query->where(function ($sub) use ($q) {
                $sub->where('detail', 'like', '%'.$q.'%')
                    ->orWhere('action', 'like', '%'.$q.'%')
                    ->orWhere('objet_type', 'like', '%'.$q.'%');
            });
        }

        $logs = $query->orderByDesc('horodatage')->get();

        $this->audit->log('audit.export', 'journal_audit', null, null, ['nb' => $logs->count()]);

        $out = fopen('php://temp', 'r+');
        fputcsv($out, ['Horodatage', 'Utilisateur', 'IP', 'Action', 'Objet type', 'Objet id', 'Détail']);
        foreach ($logs as $l) {
            fputcsv($out, [
                $l->horodatage?->format('Y-m-d H:i:s'),
                $l->user?->name,
                $l->ip,
                $l->action,
                $l->objet_type,
                $l->objet_id,
                $l->detail,
            ]);
        }
        rewind($out);
        $csv = stream_get_contents($out);
        fclose($out);

        return response($csv)
            ->header('Content-Type', 'text/csv; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="journal-audit-'.now()->format('Y-m-d').'.csv"');
    }
}
