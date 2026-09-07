<?php

namespace App\Services;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Validator as FacadeValidator;

/**
 * RG-11 : validation d'une demande contre le schéma de formulaire versionné.
 * Le front rend le formulaire à partir du schéma, le back valide la soumission
 * contre le même schéma (RG-10). Le schéma est un JSON Schema minimaliste :
 *
 * {
 *   "fields": [
 *     { "name": "immatriculation", "label": "Immatriculation",
 *       "type": "text|date|number|select|bool|textarea|file",
 *       "required": true, "options": [...], "show_if": {"field":"x","value":"y"} }
 *   ]
 * }
 */
class DynamicFormValidator
{
    public function valider(array $schema, array $donnees): void
    {
        $fields = $schema['fields'] ?? [];
        $rules = [];
        $labels = [];

        foreach ($fields as $field) {
            $name = $field['name'];
            $labels[$name] = $field['label'] ?? $name;
            $fieldRules = [];

            switch ($field['type'] ?? 'text') {
                case 'date':
                    $fieldRules[] = 'date';
                    break;
                case 'number':
                    $fieldRules[] = 'numeric';
                    break;
                case 'bool':
                    $fieldRules[] = 'boolean';
                    break;
                case 'select':
                    $fieldRules[] = 'string';
                    if (!empty($field['options'])) {
                        $fieldRules[] = 'in:'.implode(',', array_column($field['options'], 'value'));
                    }
                    break;
                case 'file':
                    $fieldRules[] = 'array';
                    break;
                case 'textarea':
                case 'text':
                default:
                    $fieldRules[] = 'string';
            }

            // Affichage conditionnel : champ obligatoire uniquement si visible
            $visible = $this->estVisible($field, $donnees);

            if (!empty($field['required']) && $visible) {
                array_unshift($fieldRules, 'required');
            } else {
                $fieldRules[] = 'nullable';
            }

            if (!empty($field['max'])) {
                $fieldRules[] = 'max:'.$field['max'];
            }

            $rules[$name] = $fieldRules;
        }

        $validator = FacadeValidator::make($donnees, $rules);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }
    }

    /**
     * Évalue la règle d'affichage conditionnel d'un champ.
     */
    public function estVisible(array $field, array $donnees): bool
    {
        $showIf = $field['show_if'] ?? null;

        if (!$showIf || !isset($showIf['field'])) {
            return true;
        }

        return ($donnees[$showIf['field']] ?? null) === ($showIf['value'] ?? null);
    }

    /**
     * Calcule la liste des pièces obligatoires manquantes (F-103).
     *
     * @return array<int,string> noms des fichiers requis absents
     */
    public function piecesManquantes(array $schema, array $piecesFournies): array
    {
        $manquantes = [];
        $pieces = $schema['pieces'] ?? [];

        foreach ($pieces as $piece) {
            if (!empty($piece['obligatoire'])) {
                $cle = $piece['cle'];
                $trouve = collect($piecesFournies)->contains(fn ($p) => ($p['cle'] ?? null) === $cle);

                if (!$trouve) {
                    $manquantes[] = $piece['libelle'] ?? $cle;
                }
            }
        }

        return $manquantes;
    }
}
