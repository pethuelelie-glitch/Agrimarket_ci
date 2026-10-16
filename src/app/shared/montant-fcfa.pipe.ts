import { Pipe, PipeTransform } from '@angular/core';
import { formaterMontantFcfa } from './montant-fcfa';

/**
 * Affiche un montant en FCFA dans les gabarits : `{{ commande.montantTotal | montantFcfa }}`.
 */
@Pipe({ name: 'montantFcfa' })
export class MontantFcfaPipe implements PipeTransform {
  transform(montant: number | null | undefined): string {
    if (montant === null || montant === undefined) {
      return '';
    }
    return formaterMontantFcfa(montant);
  }
}
