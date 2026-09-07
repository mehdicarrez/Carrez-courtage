<?php

use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\FournisseurController;
use Illuminate\Support\Facades\Route;

// SPA React : point d'entrée unique
Route::get('/', fn () => view('app'));

// RG-51 : téléchargement de document via URL signée à durée de vie courte
// (CA-51 — l'URL rejouée après expiration est refusée par Laravel)
Route::get('/documents/{document}/secure', [DocumentController::class, 'telechargement'])
    ->name('documents.telechargement')
    ->middleware('signed');

// Visualisation du logo et des documents joints d'un fournisseur via URL signée
Route::get('/fournisseurs/{fournisseur}/logo', [FournisseurController::class, 'logo'])
    ->name('fournisseurs.logo')
    ->middleware('signed');

Route::get('/fournisseurs/{fournisseur}/documents/{cle}', [FournisseurController::class, 'document'])
    ->name('fournisseurs.document')
    ->middleware('signed');
