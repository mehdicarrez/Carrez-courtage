<?php

use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\FournisseurController;
use App\Http\Controllers\Api\MessagerieController;
use App\Http\Controllers\Api\PartenaireController;
use App\Http\Controllers\Api\ReseauSocialController;
use App\Http\Controllers\Api\SimulationController;
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

// Document joint d'une simulation via URL signée à durée de vie courte
Route::get('/simulations/{simulation}/document', [SimulationController::class, 'document'])
    ->name('simulations.document')
    ->middleware('signed');

// Logo d'un partenaire (organisation) via URL signée à durée de vie courte
Route::get('/organisations/{organisation}/logo', [PartenaireController::class, 'logo'])
    ->name('organisations.logo')
    ->middleware('signed');

// Logo d'une messagerie non référencée via URL signée
Route::get('/messageries/{messagerie}/logo', [MessagerieController::class, 'logo'])
    ->name('messageries.logo')
    ->middleware('signed');

// Logo d'un réseau social non référencé via URL signée
Route::get('/reseaux-sociaux/{reseau}/logo', [ReseauSocialController::class, 'logo'])
    ->name('reseaux_sociaux.logo')
    ->middleware('signed');

// SPA React : toute URL non reconnue par les routes ci-dessus
// est renvoyée vers l'app React, qui gère le routing côté client
Route::get('/{any}', fn () => view('app'))->where('any', '.*');
